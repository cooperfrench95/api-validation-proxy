# Project implementation steps and todos

## 1 - Initialise project

* Install vue, vuetify, electron
* Initialise both threads - express.js server thread for business logic and handling of proxy, UI thread for Vue etc. Express will listen, validate or record requests/responses, and pass them through to the destinations.
* Write a really simple, fake API for dev purposes. Just a basic CRUD type thing with a couple endpoints.

## 2 - Initial implementation of core functionality

* Listen on a port and pass on the request to the destination
* Send a response back to the frontend when receiving it from the backend
* Enable recording an endpoint and generate files based on that recording, then immediately begin actively listening to validate requests to and from that endpoint
* User should be able to select a directory from which to import these generated files
* These files should include: An entity/request definition which will be automatically checked against, as well as an extension function file.
* When a user makes changes to the extension function file these changes should be immediately reflected in the active listening without reloading the app. May have to constantly check for changes in these files.
* When validation fails, notify the user via system notification
* We don't want a huge flood of system notifications, so try to limit this somewhat or group notifications together when we get more than, say 3 in a certain time period. '4 validation errors' instead of 4 seperate notifications that are hard to read all at once.
* Edge case: What if the user's code in the extension function throws an error?
* Edge case: What if the API throws a network error or something like that?
* Edge case: What if the port the user tells us to listen on is already in use?

## 3 - GUI

* User interface should be as simple and easy to use as possible.
* The main view will be similar to a typical RSS feed where you see requests and responses coming in, with the most recent at the top. These should be colour coded based on whether the validation succeeded. They could be expansion panels so the user can click on them and get more detail.
* Users should be able to search for a specific request or filter via endpoint etc.
* Consider a virtual scroll for this view to avoid performance issues.
* When a validation fails we should show which points in the JSON the validation failed, similar to a typescript error where it underlines the point in your code where you did something wrong. Verbosity (within reason) is a good thing here.
* There should be a big red button somewhere to stop listening similar to the network tab in chrome, as well as an option to turn off system notifications.
* Possible addition: Password protect & encrypt generated files as these are essentially a guide to an entire API which could be damaging if left in the wrong hands.
* Another view will be something like a simple 'startup view' where if a certain ENV file (.validation or something) is not present or is invalid, the user can provide a path to their existing files so that the program can start.
* There should also be a settings view where the user can tweak various things. These settings should save somewhere. Not SQLite - that would be a native dependency which would require the app to be built on each individual platform for release (so build for windows on windows, build for linux on linux etc.) which is very annoying.

## 4 - Write tests, generate alpha build

* Cypress doesn't have great support for electron, so an alternative testing framework might be a good idea. Unit tests perhaps?
* Aim for as high a level of coverage as possible given time constraints, focus on most important aspects of functionality.

## 5 - Alpha testing

* Give the built alpha version to, and receive feedback from at least 3 developers.
* Manage their feedback - don't just blindly incorporate all recommendations. Time is important

## 6 - Rework according to feedback + beta

* Rework according to feedback - self explanatory
* Then repeat the previews step and this step.

## 7 - Release

* Publish to github with detailed README containing:
  * Usage instructions
  * Development instructions, for contributors
  * Summary of what the thing actually does and why it helps.
  * Roadmap for potential future additions
* Builds for at least Win + Linux should also be available on Github.
* Add MIT license.