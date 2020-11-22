# API Validator - Prototype

## Note

This is a prototype version, as such there are no tests or releases, and no localisation. Accessibility has been accounted for.
## Demo

![](https://github.com/cooperfrench95/api-validation-proxy/blob/master/DemoScreenshot1.png)
![](https://github.com/cooperfrench95/api-validation-proxy/blob/master/DemoScreenshot2.png)

## Usage

**Enter your backend URL and path to validation folder. Send your requests to localhost:3000. They will be forwarded to the target URL.**

The application asks for a backend URL you would like to send requests to, as well as a path to a folder in which your validation files should be located. It then sits as a proxy layer between your client and server in your development environment and is capable of validating request and response JSON bodies between the two according to validation files that you define.

It also has a recorder function, which will listen for a request on an endpoint and allow you to build a validation template based on this request. This way, you don't need to manually write out a series of validation files.

### Install dependencies
```
yarn
```

### Run in development mode
```
yarn electron:serve
```

Note that hot reload for the background window will not work due to the address being in use, so the express server will not be able to restart.

### Production build
```
yarn electron:build
```

You can specify the target platform with `-m` (mac), `-w` (windows) or `-l` (linux). But generally it won't build for a different platform without some configuration.

I plan to provide ready builds for each platform at a later stage.

### Caveats

* Only JSON response bodies are supported. Other responses, such as HTML may come back garbled.
* If your API relies on cookies (e.g. for auth) this package likely does not suit your needs in its current form.
* For performance, request bodies have some limitations on how they are parsed. I plan to make these optional or adjustable in future:
  
  1. All arrays within a payload will have their first item fully checked and the remaining items checked for primitive type only. For instance, a response like this:
      ```json
      {
        "data": [
          {
            "id": 1,
            "name": "Bob"
          },
          {
            "id": 2,
            "name": "Bob2"
          },
          {
            "id": 3,
            "name": "Bob3"
          }
        ]
      }
      ``` 
      would be checked like this:
      * Check that root object contains data property.
      * Check that data property is an array.
      * Check that the first item in the array is an object.
      * Check that the first item in the array has the property `id` and that it is a number.
      * Check that the first item in the array has the property `name` and it is a string.
      * Check that the second item in the array is an object.
      * Check that the third item in the array is an object.

      This is done because often large arrays filled with large objects exist in responses and it is very expensive to check every single item.

  2. Response bodies that result in a beautified JSON string of more than 4000 characters will be concatenated when displayed to the user
  3.  Only 100 requests are kept in memory at once. After this, old requests are discarded.

* Currently there is no mechanism to keep validation files synced, for instance in a remote repo. This is also planned for the future, but right now they are stored in your file system.
* In future there could be a way to export your validation files as OpenAPI (Swagger) documentation, or to create generated test cases for your API. But this isn't part of this version.
* It won't work with endpoints that expect things like tree structures that are handled recursively
