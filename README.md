# "Jump Free" VSCode Plugin

## Introduction

"Jump Free" is a VSCode extension that aims to link two pieces of code that have an inherent connection but cannot be directly jumped from one to the other. By simply writing "JumpFreeTo: xxx" and "JumpFreeTarget: xxx", you can swiftly navigate between distant or related sections of your codebase, enhancing your productivity and efficiency.

## Features

- **Association of Linked Code Blocks**: Link two code snippets that are related but don't necessarily provide a direct link.

- **Code Navigation**: Easily navigate between associated code blocks by utilising the "JumpFreeTo: xxx" and "JumpFreeTarget: xxx" annotations.

## Usage

1. Open the file where you want to create a link.
2. Write `JumpFreeTo: xxx` at the point from which you want to create the link.
3. Write `JumpFreeTarget: xxx` at the point to which you want to jump.
4. Use "Jump Free" plugin to jump between the created links. Just click on `JumpFreeTo: xxx`, it will take you to the place where `JumpFreeTarget: xxx` is written.

> Note: Ensure the `xxx` you write after `JumpFreeTo:` and `JumpFreeTarget:` matches. The plugin uses this to identify which blocks of code to associate.

## Installation

The plugin can be installed from the Visual Studio Code marketplace. Search for "Jump Free" and click on the install button.

## Feedback and Issues

If you have any feedback or if you come across any issues while using the "Jump Free" plugin, please feel free to raise an issue in our [GitHub repository](https://github.com/HEKEH/JumpFree). I will be more than happy to assist!

**Enjoy!**
