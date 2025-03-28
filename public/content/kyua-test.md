# Setting up Kyua testing in a UFS FreeBSD Jail
#### By Kat P. @kpowkitty
---

### Introduction

My experience with setting Kyua up was piecemeal across resources and not easily understood. My intent with this was to put it all into one location, to hopefully ease future FreeBSD developers into Kyua and save them some of the head scratching I went through. So, without further ado: here is how you set up a UFS FreeBSD Jail for Kyua tests\!

### Pre-Jail

For Kyua, you need to select tests when installing FreeBSD. If you have already installed FreeBSD and you did not include that, you will need to do a little extra:

```bash
# vi /etc/src.conf
```
```bash
/etc/src.conf
WITH_TESTS=yes
```
```bash
# make buildworld
```
```bash
# make installworld
```
```bash
# etcupdate
```
```bash
# reboot
```

If you are unsure whether you have tests enabled:

```bash
# ls /usr/tests
```

---

### Creating a template for future jail needs

If you are like me, and this is your first experience with FreeBSD jails, you should create a jail template before you start containerizing. With a template, you can simply copy and paste your jail effortlessly without having to go through the base jail configuration every time. Inside your final jails’ config, you can manipulate each jail in a single place, with the base configuration written once. Thank you to the *FreeBSD Handbook* Ch. 17.4.1, “[Creating a Classic Jail](https://docs.freebsd.org/en/books/handbook/jails/#creating-classic-jail),” and Genneko’s “[Learning Notes on FreeBSD Jails](https://genneko.github.io/playing-with-bsd/system/learning-notes-on-jails/),” for most of this information\!

*Note: all uses of “$VARIABLE” are expecting you to replace it with your own input.*

```bash
# mkdir -p /usr/local/jails/containers && mkdir /usr/local/jails/templates
```

“Containers” is where you will store your jail copies. “Templates” is where you will keep your templated FreeBSD(s).

Navigate to your templates folder, and grab whichever **base.txz** you need for your architecture from https://www.freebsd.org/where/. Then, extract it.

```bash
# cd /usr/local/jails/templates
```
```bash
# fetch ftp://ftp.freebsd.org/pub/FreeBSD/releases/$ARCHITECTURE/$RELEASE/base.txz
```
```bash
# tar -xJvpf base.txz -C /usr/local/jails/templates/$RELEASE
```

And the rest is exactly like Genneko’s template set-up. I will omit pointless repetition and [point you towards his guide](https://genneko.github.io/playing-with-bsd/system/learning-notes-on-jails/). Come back when you’re done with the template.

Now that we have the template, we will:

```bash
cp -r /usr/local/jails/templates/$RELEASE /usr/local/jails/containers/$NAME_OF_JAIL`
```

Now, we are ready to start the jail.

```bash
# service jails start $NAME_OF_JAIL
```

### Before We Enter the Jail  

Since we are going to be using Git to pull in the src tree for testing, we need
to install Git in our jail. In the host, we will run these commands:

```bash
# pkg fetch -d git
```

Here, pay special attention to what git version it fetches, and make to to include
that in `$GIT` below. You only need to do this for `$GIT`, not for the other packages
it brings in.

```bash
# pkg -j $JAIL_NAME add /var/cache/pkg/$GIT.pkg
```

With that, we are now ready to enter the jail.

```bash
# jexec $NAME_OF_JAIL
```

---

### Inside the Jail

Since we are going to be using Git to pull in the source tree for testing, we need to enable `sshd`. 
This is so we can connect to Github with SSH, and pull in the freebsd-src tree. 
This information is found under *GitHub Docs*, “[Connecting to GitHub with SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh).”

```bash
# vi /etc/rc.conf 
```
```bash
# Enable sshd for Git
sshd_enable= “YES”
```
```bash
# cd ~/.ssh
```
```bash
# vi config
```
```sh
# Github Authentication
Host github.com  
    HostName github.com   
    User git  
    IdentityFile ~/.ssh/"$YOUR_IDENTITY_FILE”
```
```bash
# ssh-keygen -t ed25519 -C "$GITHUB_EMAIL"
```

We need to give our identity file to the ssh agent. First, confirm it is on, and then add your identity like so:

```bash
# eval "$(ssh-agent -s)"
```
```bash
# ssh-add ~/.ssh/$YOUR_IDENTITY_FILE
```
```bash
# git config user.name “$GITHUB_USER”
```
```bash
# git config user.email “$GITHUB_EMAIL”
```
```bash
# cat $YOUR_IDENTITY_FILE.pub
```

Open Github, navigate to your settings, and click SSH/GPG Keys on the left hand side. Create a new key, copy what was cat’d to your terminal, and paste it here. Name it and save it. To check if it is setup:

```bash
# ssh -T git@github.com
```

You should receive a success message with that command. If you do not, you messed up throughout this process and need to redo this section.  
Now, bring your desired git repo down into `/usr/src` to make the tests.
```bash
# mkdir -p /usr/src/ 
```
```bash
# cd /usr/src`  
```
```bash
# git clone $FREEBSD_SRC_SSH_LINK`
```
---

### Kyua Testing

Now with that setup, you can navigate to the test suite in FreeBSD’s src that you would like to run Kyua tests.   

```bash
# cd path/to/the/tests
```
```bash
# make
```
```bash
# make install
```

If this is successful, you can now navigate to the same tests in:

```bash
# cd /usr/tests/path/to/the/tests
```
```bash
# kyua test
```

Success\! Now, you can make changes to your tests in `freebsd-src`, and then run them in `/usr/tests`. Happy testing.
