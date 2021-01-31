module.exports = {
    "request": {
        "GET": {
            "/asd/:number": "GET requests should not have JSON bodies and are therefore ignored"
        },
        "POST": {
            "/asd/:number": {
                "id": "uuid",
                "start": "timestamp",
                "end": "timestamp",
                "title": "string&length>10",
                "description": "string",
                "budgetedHours": "number",
                "project": "uuid",
                "parent": "uuid",
                "dependsOn": "null"
            }
        }
    },
    "response": {
        "GET": {
            "/asd/:number": {
                "name": "string",
                "message": "string",
                "code": "number",
                "className": "string",
                "data": {
                    "url": "string"
                },
                "errors": {}
            }
        },
        "POST": {
            "/asd/:number": {
                "name": "string",
                "message": "string",
                "code": "number",
                "className": "string",
                "data": {
                    "url": "string"
                },
                "errors": {}
            }
        }
    }
}