module.exports = {
  request: [
    {
      id: "uuid",
      start: "timestamp",
      end: "timestamp",
      title: "string&length>10",
      "description?": "string|null",
      budgetedHours: "number",
      project: "uuid",
      parent: "uuid",
      dependsOn: "uuid|null",
      slotTemplate: {
        employees: {
          "generic?": {
            "3?": {
              amount: "number",
              start: "string",
              end: "string",
              "breaks?": [
                {
                  start: "string",
                  end: "string"
                }
              ]
            }
          }
        },
        resources: {}
      }
    }
  ]
};
