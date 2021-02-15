const { TwilioClientCommand } = require("@twilio/cli-core").baseCommands;
const { TwilioCliError } = require("@twilio/cli-core").services.error;
const { flags } = require("@oclif/command");
const inquirer = require("inquirer");
const fs = require("fs");
const fetch = require("node-fetch");

class SelectFlexConfigRestore extends TwilioClientCommand {
  constructor(argv, config, secureStorage) {
    super(argv, config, secureStorage);
    this.flexConfig = {};
    this.showHeaders = true;
    this.latestLogEvents = [];
  }

  async run() {
    await super.run();
    let flexConfigFiles = this.findFlexConfigFiles();
    if (flexConfigFiles.length === 0) {
      throw new TwilioCliError("There are no backup in this folder");
    }
    let choice = await inquirer.prompt([
      {
        type: "list",
        name: "fileName",
        pageSize: 15,
        message: "Select a file to restore",
        choices: flexConfigFiles,
        loop: false,
      },
    ]);
    this.flexConfig = JSON.parse(fs.readFileSync(choice.fileName))
    console.log('Updating Flex Configuration...')
    await this.updateFlexConfig(this.flexConfig);
    console.log('Flex Configuration restored')
  }

  findFlexConfigFiles() {
    let files = fs.readdirSync("./");
    files = files.filter((file) => file.startsWith("flexconfig_AC"));
    return files;
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
}

SelectFlexConfigRestore.description = "Restore a previously backed up Flex configuration";

SelectFlexConfigRestore.PropertyFlags = {
  "log-level": flags.enum({
    options: ["error", "warning", "notice", "debug"],
    description: "Only show log events for this log level",
  }),
};

SelectFlexConfigRestore.flags = Object.assign({});

module.exports = SelectFlexConfigRestore;
