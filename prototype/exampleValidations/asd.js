module.exports = {
    "request": {
        "POST": {
            "id": "uuid",
            "start": "timestamp",
            "end": "timestamp",
            "title": "number",
            "description": "null",
            "budgetedHours": "number",
            "project": "uuid",
            "parent": "uuid",
            "dependsOn": "null",
            "slotTemplate": {
                "employees": {
                    "generic": {
                        "3": {
                            "amount": "number",
                            "start": "string",
                            "end": "string",
                            "breaks": [
                                {
                                    "start": "number",
                                    "end": "string"
                                }
                            ]
                        }
                    }
                },
                "resources": {}
            }
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
            "errors": {}
        }
    }
}