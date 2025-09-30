# ACPI INITIALIZATION IN LOADER WITH LUA BINDINGS

This work can be found at 
[github](https://github.com/kpowkitty/freebsd-src/tree/acpi_init). 
I have also provided a 
[README.md](https://github.com/kpowkitty/freebsd-src/blob/acpi_init/stand/efi/acpica/README.md).

## Lua Bindings -- First Step: ACPI Initialization in Loader

The goal of this project is to be able to enumerate ACPI device nodes
into Lua bindings, so we can script ACPI functionality. The problem is that
ACPI device nodes are in AML. To be able to evaluate AML objects, we need to
initialize ACPI enough to utilize its AML evaluation routines.

The three main interfaces that provide this functionality is AcpiInitializeTables,
AcpiInitializeSubsystem, and AcpiEnableSubsystem. 

To approach this problem, I first spent time before the project designing
class diagrams of FreeBSD's current ACPICA implementation for amd64 and arm64.
I also designed a test plan with unit, integration, and regression testing. I
gathered sources of documentation. These were sourced from FreeBSD's man pages
and handbooks, Lua's standard documentation, and other sources from the ACPI
community such as Linux and UEFI, with Intel's ACPICA reference guide as
the main source.

Once coding began, my next steps were to truly know everything that I need
to bring from the kernel into the loader in order to reduce overhead and
memory load. ACPICA is a fairly large set of files, so I wanted to ensure that 
I only bring over exactly what's needed to evaluate AML objects. Upon tracing
through the code, I found that AcpiInitializeTables, AcpiInitializeSubsystem,
and AcpiEnableSubsystem are what would be necessary to do that. So, to have
a definitive list of what functions are needed for these routines, I created
a recursive shell script that uses `cflow` to generate (almost) all the callees
of each function in these interfaces. I say almost because cflow struggles
with macros and preprocessing, but it was only missing a handful out of over
a hundred, so it did its job plenty enough.

Now that I had a call graph, I could approach each ACPI linker error by
comparing it to my call graph. If it's in the call graph, then I need to include
it and all its callees. If it's not in the call graph, then I manually checked
to ensure if it actually was not supposed to be included. This task was a bit
tedious, so I made another script to do this for me. Essentially, it grabbed
the first linker error, checked the function against the call graph, and if it
was in it, it automatically added it to the Makefile. Subsequently, if it hit
one that was not in the call graph, it pauses for input. Here, I can let
it continue if it is supposed to be there, or I can manually investigate. This
led me to every function of the ACPICA call tree that I could prune away.
At the end of my scripts run, it should have cleaned up all linker errors with
only a handful of interventions from the programmer.

Once I had it compiling, I needed to test a few things:
1. That the loader has ACPI's RSDP information
2. That the kernel is still receiving ACPI's RSDP information
3. That the kernel's implementation of ACPICA remains in tact

### Building -- Issues and resolutions
There were two major fault points.

1. There is an optional `_OSI` method which is a set of strings defining
the current operating system interface. While in the loader, there is
no OSI, thus resulting in a null dereference. The solution was to set this
to false.

2. The second fault was my own problem.
- Context: `AcpiOsGetRootPointer` is a function
for getting the Root System Description Pointer, which is the head of all
the device trees. ACPICA expects this head pointer,
not the trees themselves, as it internally handles which device tree
to grab from. 

- The issue: I mistakenly passed it a single tree (`RSDT/XSDT`).

- A major obstable: This was causing non-deterministic General Protection Faults 
(GPFs) all over the place; using GDB kept taking me to different 
functions faulting. This was quite confusing to debug. 

- Overcoming the problem: When I tried using the RIP instruction to calculate
the offset and manually discover the GPF, I found that I was getting
a GPF on the same instruction everytime. So, I walked up the call stack,
determined its calling parent, and added print statements all around that
area. With this, I was able to confirm that it was in fact GPF'ing there,
and on what address. 

- Discovering the solution: Specifically, it was faulting when accessing `Header`
during `AcpiTbPrintTableHeader`, which was previously invoked by
`AcpiTbInstallTableWithOverride` in this execution path. I inserted debug print
statements in each possible execution path within `AcpiTbPrintTableHeader`.
There are only 3 possible execution paths here, and if none of them are reached,
then the GPF is confirmed here. And in fact, that is exactly what happened:

```C
Consoles: EFI console
InitVal->Name: _GPE.
InitVal->Name: _PR_.
InitVal->Name: _SB_.
InitVal->Name: _SI_.
InitVal->Name: _TZ_.
InitVal->Name: _REV.
AcpiNsAttachObject for InitVal->Name: _REV.
Type: 1.
Name: _REV.
InitVal->Name: _OS_.
AcpiNsAttachObject for InitVal->Name: _OS_.
Type: 2.
Name: _OS_.
InitVal->Name: _GL_.
AcpiNsAttachObject for InitVal->Name: _GL_.
Type: 9.
Name: _GL_.
InitVal->Name: _OSI.
Successful AcpiNsRootInitialize.
Xsdt: 3216494824.
Inside AcpiTbParseRootTable
Inside AcpiTbPrintTableHeader. // First entrance into AcpiTbPrintTableHeader
Standard ACPI statement. // Here we exit AcpiTbPrintTableHeader normally
Inside AcpiTbParseRootTable -- 2 // Second call to AcpiTbPrintTableHeader
Inside AcpiTbPrintTableHeader. // Second entrance into AcpiTbPrintTableHeader
// We've entered AcpiTbPrintTableHeader but never hit an execution path out.
// This is because we have hit garbage memory when we try to compute
// ACPI_COMPARE_NAMESEG (Header->Signature, ACPI_SIG_FACS)
!!!! X64 Exception Type - 0D(#GP - General Protection)  CPU Apic ID - 00000000 !!!!
ExceptionData - 0000000000000000
RIP  - 00000000BE354AAD, CS  - 0000000000000038, RFLAGS - 0000000000010202
RAX  - 000000000000001E, RCX - 0000000000000001, RDX - FEFEFEFEFEFEFE00
RBX  - 2020202000000001, RSP - 00000000BFEEA6F0, RBP - 00000000BFEEA740
RSI  - 00000000BE3D4222, RDI - 00000000B7F2FF63
R8   - 00000000BE3CD868, R9  - 630066746E697270, R10 - 0000000000006300
R11  - 61FF65736D68716F, R12 - 0000000000000008, R13 - 0000000000000000
R14  - 2020202000000001, R15 - 2020202000000001
DS   - 0000000000000030, ES  - 0000000000000030, FS  - 0000000000000030
GS   - 0000000000000030, SS  - 0000000000000030
CR0  - 0000000080010033, CR2 - 2020202000000001, CR3 - 00000000BFC01000
CR4  - 0000000000000668, CR8 - 0000000000000000
DR0  - 0000000000000000, DR1 - 0000000000000000, DR2 - 0000000000000000
DR3  - 0000000000000000, DR6 - 00000000FFFF0FF0, DR7 - 0000000000000400
GDTR - 00000000BF9DE000 0000000000000047, LDTR - 0000000000000000
IDTR - 00000000BF634018 0000000000000FFF,   TR - 0000000000000000
FXSAVE_STATE - 00000000BFEEA350
!!!! Find image based on IP(0xBE354AAD) (No PDB)  (ImageBase=00000000BE345000, EntryPoint=00000000BE35A6D0) !!!!
```

From this, I knew that I was incorrectly passing `RSDP` information somewhere,
and the only code that I wrote myself that did that would be in `OsdMemory.c`, 
specifically `AcpiOsGetRootPointer`, as that was where I was passing the tree
information. With previous suspicions that this was incorrect from the beginning,
I confirmed the correct behavior using Intel's ACPICA reference manual.

Upon refactoring the code to instead return the RSDP itself rather than one of
its children, I had `AcpiInitializeTables` successfully running in the loader
environment on my QEMU VM.

### AcpiEnableSubsystem

The next part of the ACPICA sequence is `AcpiEnableSubsystem`. This was added on
easily with no GPFs. I am running it in reduced hardware mode, but with events
enabled.

### ACPICA Initialization in Loader: Confirmation & Correctness tests

I am able to successfully initialize ACPICA in the loader under the three interfaces
I've introduced above, along with AcpiLoadTables(). I have checked the serial
output during loader run time, and I have performed a walk of the namespace
using AcpiWalkNamespace and printing each node path.

To confirm correctness, I created a kernel dump module and loader dump routine
that both used AcpiWalkNamespace to dump the namespace in the exact same
fashion, and then used `diff` to compare their outputs.

```
❯ diff cleaned_serial.log kern_acpi_dump.txt
348a349
> acpidump: \_OSI
```

While this diff at first glance may seem problematic, it is in fact not: `\_OSI`
is the operating system interface, and as it is not present in the loader, it is
set to FALSE. Therefore, that is an expected diff. This confirms we have 
successfully initialized ACPI tables in the loader.

The work for these dump routines can be found on branch `feature_branch_rev`.

### Conditional Compilation

The proposal of this work initially planned for amd64 *and* arm64 compatibility.
Arm64 needs to be postponed to ensure the successful delivery of the Lua half
of the project. I plan to revisit arm64 compat after the GSoC period.

So, I have ACPI conditionally compiling in the loader environment if the user
is on an amd64 system. 


## Lua Bindings - Second step: Lua

Currently, we have ACPI initialized in reduced hardware mode with events
enabled. I have excluded notify handlers for now. I have designed a class
diagram for what ACPI functions we can expose to Lua.  
  
These functions are:  

```bash
AcpiGetHandle
AcpiEvaluateObject
AcpiAttachData
AcpiDetachData
AcpiGetData
AcpiWalkNamespace
```

The C Wrapper functions are:  

```bash
lAcpiGetHandle
lAcpiEvaluateObject
lAcpiAttachData
lAcpiDetachData
lAcpiGetData
lAcpiWalkNamespace
```

The Lua interface is:

```bash
get_handle
evaluate
attach
detach
get
namespace
```

### Setting up the boiler plate

We want to define a linker set for our lua modules so we do not need to rebuild
the entire lib everytime we incorporate a new ACPI lua module. Using FreeBSD's
`linker_set`, we can design a system where the user calls `LUA_ACPI_COMPILE_SET`
defining `name` and `fn` of the new module. We then use `SET_DECLARE` to
initialize the set. This sets up weak symbols for the start and end of the set.
Our set here is a series of lua modules, which thus are populated into a
c-structure. So, to make this programmatic, we define a macro that does
this for us for each instantiation of a `LUA_ACPI_COMPILE_SET`. To make these
appear in our linker set, we mark the end of the macro with 
`DATA_SET(set, sym)`.

To register these modules in the lua interpreter, we can walk this list with
`SET_FOREACH`. We need to be careful to only register these modules if 
`acpi_is_initialized()`. 

With this boiler plate set up, I was able to create a minimal working example
of `lAcpiGetHandle`, which is demonstrated working below:

```lua
Type '?' for a list of commands, 'help' for more detailed help.
OK print(acpi_util)
table: 0xba1f2a00
OK print(acpi_util.get_handle("\\_SB"))
userdata: 0xba1d7fe0
OK
```

### Implementing the Lua Interface

Now that we have the boiler plate set up, we can reiterate and further implement
our lua interface. As for designing the interface, we could go two ways.
We could implement a monolithic library, with everything in a single file, or
we could take a modularized approach, breaking up similar sets of ACPI functions
into their own namespace. Since ACPI is a large system with many use cases, I
am opting for the modularized approach. When we register them, they will still
compile into a continguous set all at once, but this way we have smaller
files to parse through later, and each file has its own domain.

The new ACPI lua interface looks like:

```bash
# Object handling
# lacpi_object.c
lAcpiGetHandle
lAcpiEvaluateObject
```

```bash
# Data management
# lacpi_data.c
lAcpiAttachData
lAcpiDetachData
lAcpiGetData
```

```bash
# Namespace traversal and it's various callbacks
# lacpi_walk.c
lAcpiWalkNamespace

# Note: I envision this module having several call backs associated with it
# depending on the needs of the userbase. While I may not be able to iterate on
# all of them in GSoC's timeline, I would like to in the future. Therefore,
# I believe this module should be separated.
```

## Additional work
While integrating ACPICA into the loader, I discovered that `libsa/stand.h` did
not have `isprint()` while having all the other `isfoo()` functions. Furthermore,
I found that `libsa/hexdump.c` had raw `!isprint()` code written in it. So, I
refactored that code into `isprint()` using De Morgan's law, pulled it out and
performed a unit test confirming it was correctly working for all ASCII codes,
added it to `libsa/stand.h` and replaced the raw code in `libsa/hexdump.c` 
with the new function. That work can be found on 
[this pull request](https://github.com/freebsd/freebsd-src/pull/1740).
