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
      for (const key in obj) {
        let keyString = `${Array(indent).join(" ")}${key}: `;
        if (obj[key] === null || typeof obj[key] !== "object") {
          tmpArray.push({
            name: `${keyString} ${obj[key]},`,
            value: [...ancestors, key],
          });
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
      if (responseJSON.status === 404) {
        throw new TwilioCliError(responseJSON.message + '. Are you sure this is a Flex Project?');
      }
      return responseJSON;
    } catch (error) {
      throw new TwilioCliError('Error fetching Flex Configuration.\n' + error);
    }
  }

  async updateFlexConfig(config) {
    try {
      [
        "status",
        "flex_service_instance_sid",
        "runtime_domain",
        "taskrouter_workspace_sid",
        "service_version",
        "taskrouter_offline_activity_sid",
      ].forEach((property) => {
        delete config[property];
      });

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
      return responseJSON;
    } catch (error) {
      throw new TwilioCliError("Error updating Flex Configuration");
    }
  }

  backupConfig(config) {
    let now = new Date();
    let fileName = `flexconfig_${config.account_sid}_${now
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
