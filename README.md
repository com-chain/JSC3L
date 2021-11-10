# JSC3L

JavaScript Com-Chain Communication Library

## History

This lib was extracted from Biletujo project.

## Usage

This module provides a `Jsc3lAbstract` class that needs to be
subclassed to be used. This allows to inject different implementation
of core elements that may vary depending on where you are using the
JSC3L. There are only 2 elements to provide :

- httpRequest: a mean to make an http request

- persistentStorage: a storage that will persist between runs

These should follow precise behaviors and interfaces. You can find a
nice implementation for node and browsers in npm package
`jsc3l-browser`. Actually, you could only depend on this last package
if you are developping on a browser platform.

## Demo

An toy example is provided to show JSC3L usage in npm package `jsc3l-browser-test`.
You should have a glance at it.

## Developers

Package is using `npm` to track dependendies, so you can install them
with:

   ```shell
   npm install
   ```

As this package is written in `typescript`. You can transpile to
javascript and transpile on file change with:

   ```shell
   ## Compile and watch
   npx tsc -w
   ```