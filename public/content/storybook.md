# Storybook: A Two Part Tale
#### By Kat Powell, @kpowkitty

---

## **Part One: Finding the Ghost Bug**

### **A tale of debugging woes**

### **Introduction**

Storybook is an open source application for testing components with modularized testing, 
saving developers countless hours of tedious boilerplate. Written in typescript, 
it is an industry leading application with over 80k stars on Github. My name is Kat, 
and I was put on the CTI-Accelerate/CodeDay Micro-Internship group tasked to 
solve one of Storybooks ongoing issues, [\#30053](https://github.com/storybookjs/storybook/issues/30053), 
a bug I have deemed the “Ghost Bug,” because as of yet, I have been unable to replicate it. 
In this blog post, I am going to take you on my journey of finding this “Ghost Bug”; 
you’re going to see all the ways in which I failed along the way, and hopefully 
by walking you through my mistakes, you can avoid them yourself in the future. 
And maybe, just maybe, we can finally find this “Ghost Bug”.

### **Crossing the First Threshold**

The first step to any contribution is building the project locally. On my desktop, 
I used Gentoo Linux (6.12.11 at the time of this blog post), and on my laptop, 
I have a Macbook Air M3. Below, I will explain how I built the project for both 
operating systems.

Regardless of the system, you need 3 main dependencies: `node`, `fnm`, and `yarn`.

---

### **Gentoo Linux 6.12.11**

### **Installing dependencies**

First, install `node`, and make sure you have `USE` flags `npm corepack inspector` 
enabled. If you already have `node` installed, check these `USE` flags, because in 
particular, `corepack` does not come default enabled, and we need it to bring in 
recent `yarn` versions since Gentoo’s latest `yarn` is 1.2.2 (very deprecated).

```bash
sudo emerge --ask nodejs
```
To check/change your use flags:

```bash
sudo nvim /etc/portage/package.use
```

Make sure nodejs looks like this: 

```bash
net-libs/nodejs npm inspector corepack
```

Next, we need to install `fnm`. 

```bash
sudo emerge \--ask dev-util/fnm
```

Then, either in your local project environment or `.zshrc`, add:

```bash
FNM_PATH="/home/bee/.local/share/fnm"  

if \[ \-d "$FNM\_PATH" \]; then 

  export PATH="/home/bee/.local/share/fnm:$PATH"  

  eval "'fnm env'"  

fi
```

And then source the file you added it to so your current terminal is up to date 
with this change (or restart your terminal).

```bash
source ~/path/to/your/file
```

### **Building the project**

Navigate to the root of your local storybook project.

Run these commands:

```bash
corepack enable
```

```bash
corepack use yarn@stable
```

```bash
yarn install
```

```bash
yarn start
```

Note: I had an issue with Playwright here. 

```bash
kill -9 $YARN_START_PID
```

```bash
yarn install playwright
```

```bash
yarn start
```

And it should run the demo storybook\!

---

### **MacOS Sequoia v15.11**

### **Installing dependencies**

First, install node:

```bash
brew install node
```

Next, install `fnm`:

```bash
brew install fnm
```

Then, either in your local project environment or `.zshrc`, add:

```bash
eval "$(fnm env --use-on-cd --corepack-enabled --version-file-strategy recursive)"
```

And then source the file you added it to so your current terminal is up to date 
with this change (or restart your terminal).

```bash
source ~/path/to/your/file
```

Next, we’re going to use `corepack` to manage our `yarn` environment. 
Since projects vary on what `yarn` version they can use, `corepack` allows you to 
pull in a specific `yarn` local to the current project you are building.

```bash
brew install corepack
```

### **Building the project**

Now, navigate to the project on your local machine, and run:

```bash
corepack enable
```

```bash
corepack use yarn@stable
```

```bash
yarn install
```

```bash
yarn start
```

And it should run the demo storybook\!

---

### **Bug? What Bug?**

Now that we have Storybook up and running, we need to replicate the issue.

To open the test component, find the rectangle component in the bottom left hand
corner. Hover over it and there should be an arrow there. Click on it.

Next, we hit run tests.

…and realize that the bug, as explained in [issue \#30053](https://github.com/storybookjs/storybook/issues/30053), 
does not happen. So what’s going on here??

### **Returning to Disaster**

After I built the program, I took a break to take care of school. So, when I came
back to it a few days later, I was met with a developer's worst nightmare: an 
updated repo with all new fancy versions and packages. This meant that all my 
caches were now outdated. This is where I ran into a major hiccup: my project, 
which was previously building, is now not building anymore, and it’s up to me 
and some mighty google-foo to figure out what’s wrong.

My immediate thought was to reset `yarn` and `node`. I did so by:

```bash
yarn cache clean
```

```bash
npm cache clean - -force
```

```bash
rm yarn.lock
```

```bash
rm -r node_modules
```

Now, I should be back to a normal state. So, let’s try rebuilding the app again:

```bash
yarn start
```

…And I get the same error. I tried clearing all my caches again, 
updating specific packages, updating my computer, resetting to main, etc., 
but NOTHING was working\! After two hours too long of trying to fix this with 
my mighty google-foo, I had a “genius” idea to try and clone the repo again and 
see if it would build. Voilà\! It built\!...So I (carefully) deleted my local 
machine’s forked repo copy, re-cloned my fork, and was able to build again.

I still have no idea what happened or why, and that bothers me, so if anyone 
knows what was happening, please kindly let me know.  

---

### **Returning to Disaster (Part 2\)**

Well, now that things are up and running smoothly again, I now can continue 
finding this bug. So, I navigate back to the file that I believe it is located 
in: `code/addons/test/src/components/Description.tsx` ...and noticed some serious \
changes. 

Before, they were changing the description of the test run based on a state function.
The state function, if not ran correctly, will allow the test description string
to be set to 'Not run'. I deduced that somewhere, the state was getting reset.

Unfortunately, though, when I came back to the updated repo, I found something
completely different.  

They completely refactored how they managed the state within the control flow. 
This, combined with our inability to replicate the issue, several missed 
attempts at getting in touch with the git issue maintainer, 
and such little information about the bug (What architecture are you on? What 
tests did you run? were all very unanswered questions), we decided to tackle a 
different git issue. 

---

## **Storybook, Part Two: Out of the Frying Pan, Into the Fire**

### A venture into an entirely different side of Storybook

After conferring with our mentor and CodeDay, we agreed that we should work on 
a different git issue: [\[Bug\]: Storybook code coverage should ignore storybook-static \#30525](https://github.com/storybookjs/storybook/issues/30525). 
Essentially, Storybook has integrated Vitest, and with Vitest, you can run coverage 
tests. What is coverage? Well, coverage is “the percentage of statements covered 
by your tested stories,” as Storybook explains it best in [this writeup](https://storybook.js.org/docs/writing-tests/test-coverage). 
Remember, Storybook is all about creating stories that can test various parts 
of your code. Ideally, you would want to be able to test all the testable parts of your code, right? So, there needs to be some way of knowing you are actually doing that. Boom, that’s where coverage tests come in: a viable way to tell if you are properly testing everything… Except the fact that it is also calculating non-testable code. 

### **The Problem**

I’m sure you can see what the problem is: you run coverage tests, and it is 
showing that you have only 30% coverage, and all the non-tested statements it 
is flagging are statements you couldn’t test even if you tried\! That is 
extremely misleading to the user. Well, Storybook understands this, and has 
instructions on how to manually configure this away. But why should we put that 
burden on the user, when **no one** is going to want that to begin with. We 
should always be looking for ways to save time for the client (and the maintainers) 
where it makes sense. This is a perfect example\!

So, this is where I come in. I need to locate where these coverage files are 
being configured. I already had a hint of where it would be: addons, because 
that was the label on the issue. So, with a little bit of grep and a lot of coffee, 
I found myself in the directory `code/addons/test/src/node`. It’s here where I found 
coverage configuration being passed around by these local files, and more specifically, 
the file `vitest-manager.ts`.

Here, we can see the main construction of `Vitest`, and the various options that 
can be managed. 

More specifically, we narrow in on `coverageOptions`, which after 
reading [Vitest Coverage Documentation](https://vitest.dev/guide/coverage), 
is applying different settings if `coverage` is enabled. Ah, this must be what 
needs to be set in order for future Storybooks to always have this setting\! 
Well, at least that’s what I hoped. I needed to run some tests first.

### **Testing Coverage Outside of Storybook’s Main Repo**

First, I wanted to see this for myself as a client. What better way than to 
follow Storybook’s fabulous guide on [getting started with Storybook](https://storybook.js.org/tutorials/intro-to-storybook/react/en/get-started/)\! 
This tutorial is fantastic, and got everything up and running that I would need 
in order to test this out. I highly recommend following the guide if you are 
interested in Storybook or contributing to Storybook.

After following their guide, I was able to replicate the problem. 

I ran the tests, with coverage enabled, and boy oh boy. It was including *everything*,
and thus my coverage result was extremely low.  

When I added the proper configuration that Storybook suggests, there was a dramatic 
increase in coverage!

Sweet\! I have successfully replicated the issue from the client side. Next is 
to see it changing without a user configured file; rather, with Storybook’s main 
configuration file: `vitest-manager.ts`.

### **Managing the Manager**

Navigating back to the Storybook repo, I went back into that file, and using 
[Vitest’s Configuration Documentation](https://vitest.dev/config/), I found 
what variable needs to be set in `coverage`: `exclude`. Now, the fun part began: 
figuring out the correct globs that would successfully exclude excess directories 
while ensuring all the correct ones are included.

I ran `yarn start` again, and I selected `coverage tests` before starting the test 
runner. I found several files being mistakenly counted, confirming the issue. 
Now, my next task had two parts: exclude dot files, and exclude root directories, 
like `/src/` and `react-vite-default-ts/`, while including anything *inside* them 
that needs to be included. 

The first part was easy: add those dotfiles to the exclude list. Simple. 
This may need to be expanded upon, because of the unlimited potential for other 
modules’ dot files existing in someone’s project, but for now it works.

Now, the more confusing part was how to exclude the top level directory but 
include the rest of it. I had thought to do `‘\*\*/src/\*\*/\!(stories)/\*\*’`, 
which meant exclude `/src/` except for `src/\*\*/stories/`. This worked, but it 
worked for the current template. Greptile, Storybook’s AI for automated pull 
requests reviews, informed me that this could possibly exclude needed coverage 
directories in other templates. Unfortunately, though, I have been unable to 
find a workaround, and I am in contact with a Storybook reviewer to hopefully 
get some feedback on this. 

---

### **The Conclusion (For Now)**

I have successfully integrated some exclusion factors for `Vitest coverage`, 
but I have more work ahead of me. Common dotfiles are excluded without issue. 
But, the other files are only excluded if the user has this *exact* directory structure. 
I would like to make it more generalized. Otherwise, we would need to add documentation 
stating the expected directory structure.

I look forward to continuing my work with Storybook, and I plan to maintain 
[this pull request](https://github.com/storybookjs/storybook/pull/30639) until 
it is committed to the source tree. In the future, I would like to fix more git 
issues with Storybook and even become a maintainer\! I am extremely grateful for 
CTI and CodeDay accepting me as part of this Micro-Internship. I have learned so 
much about the open source community, the software development life cycle, and I 
have been given the amazing opportunity to contribute to a widely used, mainstream 
software application. Thank you again, and thank you for reading. 🙂
