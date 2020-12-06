module.exports = {
    "request": {
        "POST": {
            "id": "uuid",
            "start": "timestamp",
            "end": "number",
            "title": "string&length>10",
            "description": "string",
            "budgetedHours": "number",
            "project": "uuid",
            "parent": "uuid",
            "dependsOn?": "null",
            "/asd/:number": {
                "id": "uuid",
                "start": "timestamp",
                "end": "timestamp",
                "title": "string",
                "description": "string",
                "budgetedHours": "number",
                "project": "uuid",
                "parent": "uuid",
                "dependsOn": "null"
            }
        },
        "GET": {
            "/asd/:number": "GET requests should not have JSON bodies and are therefore ignored"
        }
    },
    "response": {
        "POST": {
            "name": "string",
            "message": "string",
            "code": "number",
            "className": "string",
            "data": {
                "url": "string"
            },
            "errors": {},
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
        }
    }
}