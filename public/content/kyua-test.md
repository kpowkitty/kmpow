# Setting up Kyua testing in a UFS FreeBSD Jail
## By Kat P. @kpowkitty
---

### Introduction

My experience with setting Kyua up was piecemeal across resources and not easily understood. My intent with this was to put it all into one location, to hopefully ease future FreeBSD developers into Kyua and save them some of the head scratching I went through. So, without further ado: here is how you set up a UFS FreeBSD Jail for Kyua tests\!

### Pre-Jail

For Kyua, you need to select tests when installing FreeBSD. If you have already installed FreeBSD and you did not include that, you will need to do a little extra:

`# vi /etc/src.conf`  
`WITH_TESTS=yes`  
`# make buildworld`  
`# make installworld`  
`# etcupdate`  
`# reboot`

If you are unsure whether you have tests enabled:

`# ls /usr/tests`

---

### Creating a template for future jail needs

If you are like me, and this is your first experience with FreeBSD jails, you should create a jail template before you start containerizing. With a template, you can simply copy and paste your jail effortlessly without having to go through the base jail configuration every time. Inside your final jails’ config, you can manipulate each jail in a single place, with the base configuration written once. Thank you to the *FreeBSD Handbook* Ch. 17.4.1, “[Creating a Classic Jail](https://docs.freebsd.org/en/books/handbook/jails/#creating-classic-jail),” and Genneko’s “[Learning Notes on FreeBSD Jails](https://genneko.github.io/playing-with-bsd/system/learning-notes-on-jails/),” for most of this information\!

*Note: all uses of “$VARIABLE” are expecting you to replace it with your own input.*

`# mkdir -p /usr/local/jails/containers && mkdir /usr/local/jails/templates`

“Containers” is where you will store your jail copies. “Templates” is where you will keep your templated FreeBSD(s).

Navigate to your templates folder, and grab whichever **base.txz** you need for your architecture from https://www.freebsd.org/where/. Then, extract it.

`# cd /usr/local/jails/templates`  
`# fetch ftp://ftp.freebsd.org/pub/FreeBSD/releases/$ARCHITECTURE/$RELEASE/base.txz`  
`# tar -xJvpf base.txz -C /usr/local/jails/templates/$RELEASE`

And the rest is exactly like Genneko’s template set-up. I will omit pointless repetition and [point you towards his guide](https://genneko.github.io/playing-with-bsd/system/learning-notes-on-jails/). Come back when you’re done with the template.

Now that we have the template, we will:

`cp -r /usr/local/jails/templates/$RELEASE /usr/local/jails/containers/$NAME_OF_JAIL`

Now, we are ready to start and enter the jail.

`# service jails start $NAME_OF_JAIL`  
`# jexec $NAME_OF_JAIL`

---

### Inside the Jail

Since we are going to be using Git to pull in the src tree for testing, we need to enable sshd. This is so we can connect to Github with SSH, and pull in the freebsd-src tree. This information is found under *GitHub Docs*, “[Connecting to GitHub with SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh).”

`# vi /etc/rc.conf`  
`sshd_enable= “YES”`  
`# pkg install git`  
`# cd ~/.ssh`  
`# vi config`  
	`Host github.com`  
		`HostName github.com`  
		`User git`  
		`IdentityFile ~/.ssh/"$YOUR_IDENTITY_FILE”`  
`# ssh-keygen -t ed25519 -C $YOUR_IDENTITY_FILE`

We need to give our identity file to the ssh agent. First, confirm it is on, and then add your identity like so:

`# eval "$(ssh-agent -s)"`  
`# ssh-add ~/.ssh/$YOUR_IDENTITY_FILE`  
`# git config user.name “$GITHUB_USER”`  
`# git config user.email “$GITHUB_EMAIL”`  
`# cat $YOUR_IDENTITY_FILE.pub`

Open Github, navigate to your settings, and click SSH/GPG Keys on the left hand side. Create a new key, copy what was cat’d to your terminal, and paste it here. Name it and save it. To check if it is setup:

`# ssh -T git@github.com`

You should receive a success message with that command. If you do not, you messed up throughout this process and need to redo this section.  
Now, bring your desired git repo down into `/usr/src` to make the tests.

`# mkdir -p /usr/src/`  
`# cd /usr/src`  
`# git clone $FREEBSD_SRC_SSH_LINK`

---

### Kyua Testing

Now with that setup, you can navigate to the test suite in FreeBSD’s src that you would like to run Kyua tests.   

`# cd path/to/the/tests`  
`# make`  
`# make install`  

If this is successful, you can now navigate to the same tests in:

`# cd /usr/tests/path/to/the/tests`  
`# kyua test`

Success\! Now, you can make changes to your tests in `freebsd-src`, and then run them in `/usr/tests`. Happy testing.
