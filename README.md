# API Validator - Prototype

## 本程式提供中文支持

### 安裝依賴

```bash
yarn
```

### 應用方式

#### 第一 : 安裝

##### 開發模式

```bash
yarn electron:serve
```

##### 生產版本
```bash
yarn electron:build
```

這會放程式在 `dist_electron` 的資料夾, 從那裡直接點開. Linux的話他會產生 .AppImage , Mac的話是 .dmg , Windows 是 .exe 的.

#### 第二: 使用

開程式之後它會請您輸入您的輸入網址跟您想要保存驗證文件的資料夾路徑（推薦您選擇您正在開發的前端或後端程式的git資料夾裡面的路徑）。 輸入資料之後您就可以開始產生驗證文件，而且產生之後您的請求跟響應會被驗證。程式裡面有更多解釋.

## Description

The application asks for a backend URL you would like to send requests to, as well as a path to a folder in which your validation files should be located. It then sits as a proxy layer between your client and server in your development environment and is capable of validating request and response JSON bodies between the two according to validation files that you define.

It also has a recorder function, which will listen for a request on an endpoint and allow you to build a validation template based on this request. This way, you don't need to manually write out a series of validation files.

## Note

This is a prototype version, as such there are no tests and no localisation. Accessibility has been accounted for. A linux pre-release is available under Releases.

## Usage

### Step 1

Open the application. It will ask you for a backend URL and a path to your validations folder. Enter these and click continue. The backend URL should be your API, e.g. `http://localhost:3030/` or `https://api.mywebapp.com/`. `localhost:3000` is not allowed because this is the port at which the application spins up its proxy server. The path can be any **full path** on your system. The application will save .js files in here when you use the recorder.

### Step 2

You will now be in the requests view. If you make a request to `http://localhost:3000/` the application will now forward this request to your target backend URL and return the response it received. You will then also see the request in the requests view.

### Step 3

Click on `RECORDER` in the top right corner. Here you will be asked for a target endpoint and a request method. Let's pretend you want to validate a POST request to your API's `employees` endpoint. You would enter `/employees` and select `POST` from the dropdown, then hit `RECORD`.

You should see a loading spinner. Send a `POST` request to `http://localhost:3000/employees` with a request body that you would expect in normal circumstances, then go back to the application. You should now have moved to step 2,  `Review request template`. Select the types you would like for each object property and whether or not they are optional (e.g. can be entirely absent from your JSON body). You can also directly edit the template as json, and formatting instructions are available by clicking on the `?` icon or pressing `ctrl+H`.

Continue and do the same for your response, then hit save. You should now see a JS file saved at the path you entered in step 1. This is your validation template.

### Step 4

Send the same request again that you did in step 3, but this time change one of the values so that you expect it to fail validation. You should receive a system notification, and the offending request should show up in the requests view in the api validation app. You can then inspect the request and see exactly why it failed.

Now, every time you send a request to that endpoint and the app is running, it will perform this validation for you.

## Install dependencies
```
yarn
```

## Run in development mode
```
yarn electron:serve
```

Note that hot reload for the background window will not work due to the address being in use, so the express server will not be able to restart.

## Production build
```
yarn electron:build
```
This will create a production build and place it in the dist_electron folder.

You can specify the target platform with `-m` (mac), `-w` (windows) or `-l` (linux). But generally it won't build for a different platform without some configuration.

I plan to provide ready builds for each platform at a later stage.

## Caveats

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

## Screenshots


![](https://github.com/cooperfrench95/api-validation-proxy/blob/master/DemoScreenshot1.png)
![](https://github.com/cooperfrench95/api-validation-proxy/blob/master/DemoScreenshot2.png)
