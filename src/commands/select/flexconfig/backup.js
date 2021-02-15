const { TwilioClientCommand } = require("@twilio/cli-core").baseCommands;
const { TwilioCliError } = require("@twilio/cli-core").services.error;
const { flags } = require("@oclif/command");
const fs = require("fs");
const fetch = require("node-fetch");

class SelectFlexConfigBackup extends TwilioClientCommand {
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
    console.log('Saving Configuration...')
    this.backupConfig(this.flexConfig);
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
        throw new TwilioCliError(
          responseJSON.message + ". Are you sure this is a Flex Project?"
        );
      }
      return responseJSON;
    } catch (error) {
      throw new TwilioCliError("Error fetching Flex Configuration.\n" + error);
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
    console.log(`Configuration saved to ${fileName}`);
  }
}

SelectFlexConfigBackup.description = "Backup Flex Configuration to local file";

SelectFlexConfigBackup.PropertyFlags = {
  "log-level": flags.enum({
    options: ["error", "warning", "notice", "debug"],
    description: "Only show log events for this log level",
  }),
};

SelectFlexConfigBackup.flags = Object.assign({});

module.exports = SelectFlexConfigBackup;
