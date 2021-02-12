const { TwilioClientCommand } = require("@twilio/cli-core").baseCommands;
const { flags } = require("@oclif/command");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const inquirer = require("inquirer");

class SelectProfile extends TwilioClientCommand {
  constructor(argv, config, secureStorage) {
    super(argv, config, secureStorage);

    this.showHeaders = true;
    this.latestLogEvents = [];
  }

  async run() {
    await super.run();
    var { stdout } = await exec("twilio profiles:list");
    let choices = stdout.split("\n");
    let currentProfile;
    // Remove first line (header)
    choices.shift();
    // Remove last line (empty line )
    choices.pop();
    choices = choices.map((row, index) => {
      let pairs = /(.*?) AC(.*?) /.exec(row);
      if (row.indexOf(" true ") > -1) {
        currentProfile = index;
      }
      return {
        name: `${pairs[1].trim()} (${pairs[2].trim()})`,
        value: pairs[1].trim(),
      };
    });

    console.log("Current profile: ", choices[currentProfile].name);
    let choice = await inquirer.prompt([
      {
        type: "list",
        name: "profile",
        default: currentProfile,
        pageSize: 15,
        message: "Select the profile you want to enable",
        choices: choices,
      },
    ]);
    var useProfile = await exec(`twilio profiles:use ${choice.profile}`);
    let parseOutput = /set (.*?) as active profile/.exec(useProfile.stderr);
    if (parseOutput) {
      console.log(`Set ${parseOutput[1]} as active profile`);
    } else {
      console.log("Error setting profile\n", useProfile.stderr);
    }
  }
}

SelectProfile.description = "Select and switch your Twilio account / profile";

SelectProfile.PropertyFlags = {
  "log-level": flags.enum({
    options: ["error", "warning", "notice", "debug"],
    description: "Only show log events for this log level",
  }),
};

SelectProfile.flags = Object.assign({});

module.exports = SelectProfile;
