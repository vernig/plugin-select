const { TwilioClientCommand } = require("@twilio/cli-core").baseCommands;
const { TwilioCliError } = require("@twilio/cli-core").services.error;
const { flags } = require("@oclif/command");
const inquirer = require("inquirer");
const fs = require("fs");
const fetch = require("node-fetch");

class SelectFlexConfigUpdate extends TwilioClientCommand {
  constructor(argv, config, secureStorage) {
    super(argv, config, secureStorage);
    this.flexConfig = {};
    this.showHeaders = true;
    this.latestLogEvents = [];
    this.immutableProperties = [
      "account_sid",
      "status",
      "flex_service_instance_sid",
      "runtime_domain",
      "taskrouter_workspace_sid",
      "service_version",
      "taskrouter_offline_activity_sid",
    ];
  }

  async run() {
    await super.run();
    console.log("Fetching Flex Configuration...");
    this.flexConfig = await this.getFlexConfig();
    if (!this.flexConfig) {
      return;
    }
    let choice = await inquirer.prompt([
      {
        type: "list",
        name: "property",
        pageSize: 15,
        message: "Select attrribute you want to modify",
        choices: this.json2Choices(this.flexConfig),
        loop: false,
      },
    ]);
    let newValue = await inquirer.prompt({
      type: "input",
      name: "value",
      message: "New value for " + choice.property.join("."),
      default: this.getValue(this.flexConfig, choice.property).toString(),
    });
    this.backupConfig(this.flexConfig);
    await this.updateFlexConfig(
      this.setValue(this.flexConfig, choice.property, newValue.value)
    );
    console.log("Flex Configuration updated succesfully");
  }

  setValue(obj, properties, newValue) {
    let tmp = obj;
    for (var index = 0; index < properties.length - 1; index++) {
      tmp = tmp[properties[index]];
    }
    tmp[properties[properties.length - 1]] = newValue;
    return obj;
  }

  getValue(obj, properties) {
    let tmp = obj;
    properties.forEach((property) => {
      tmp = tmp[property];
    });
    return tmp;
  }

  json2Choices(obj, ancestors = []) {
    try {
      let tmpArray = [];
      let indent = ancestors.length * 2;
      let sortedEntries = Object.entries(obj).sort((a, b) =>
        a[0] < b[0] ? -1 : 1
      );
      for (const [key, value] of sortedEntries) {
        let keyString = `${Array(indent).join(" ")}${key}: `;
        if (value === null || typeof value !== "object") {
          if (this.immutableProperties.indexOf(key) > -1) {
            tmpArray.push(new inquirer.Separator(`${keyString} ${value}`));
          } else {
            tmpArray.push({
              name: `${keyString} ${value},`,
              value: [...ancestors, key],
            });
          }
        } else {
          tmpArray = [
            ...tmpArray,
            new inquirer.Separator(`${keyString} {`),
            ...this.json2Choices(obj[key], [...ancestors, key]),
            new inquirer.Separator(`${Array(indent).join(" ")}}`),
          ];
        }
      }
      return tmpArray;
    } catch (err) {
      console.log(err);
    }
  }

  async getFlexConfig() {
    try {
      let options = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            `${this.twilioClient.username}:${this.twilioClient.password}`
          ).toString("base64")}`,
        },
      };
      let response = await fetch(
        "https://flex-api.twilio.com/v1/Configuration",
        options
      );
      let responseJSON = await response.json();
      if (responseJSON.status >= 400) {
        throw new TwilioCliError(
          responseJSON.message + ". Are you sure this is a Flex Project?"
        );
      }
      return responseJSON;
    } catch (error) {
      throw new TwilioCliError("Error fetching Flex Configuration.\n" + error);
    }
  }

  async updateFlexConfig(config) {
    try {
      let accountSid = config["account_sid"];
      this.immutableProperties.forEach((property) => {
        delete config[property];
      });
      config["account_sid"] = accountSid;

      let options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            `${this.twilioClient.username}:${this.twilioClient.password}`
          ).toString("base64")}`,
        },
        body: JSON.stringify(config),
      };
      let response = await fetch(
        "https://flex-api.twilio.com/v1/Configuration",
        options
      );
      let responseJSON = await response.json();
      if (responseJSON.status >= 400) {
        throw new TwilioCliError(responseJSON.message);
      }
      return responseJSON;
    } catch (error) {
      throw new TwilioCliError("Error updating Flex Configuration.\n" + error);
    }
  }

  backupConfig(config) {
    let now = new Date();
    let fileName = `flexconfig_${
      config.account_sid
    }_${now
      .toISOString()
      .replace(/:/g, "")
      .replace(/-/g, "")
      .replace(/\./g, "")}.json`;
    fs.writeFileSync(fileName, JSON.stringify(config));
    console.log(`Old configuration saved to ${fileName}`);
  }
}

SelectFlexConfigUpdate.description = "Select and update flex configuration";

SelectFlexConfigUpdate.PropertyFlags = {
  "log-level": flags.enum({
    options: ["error", "warning", "notice", "debug"],
    description: "Only show log events for this log level",
  }),
};

SelectFlexConfigUpdate.flags = Object.assign({});

module.exports = SelectFlexConfigUpdate;
