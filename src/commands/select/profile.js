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
    let choices = await this.getProfiles();
    let currentProfile = choices.findIndex((profile) => profile.selected);
    console.log("Current profile: ", choices[currentProfile].name);
    let choice = await inquirer.prompt([
      {
        type: "list",
        name: "profile",
        default: currentProfile,
        pageSize: 15,
        message: "Select the profile you want to enable",
        choices: choices,
        loop: false,
      },
    ]);
    console.log(await this.setProfile(choice.profile));
  }

  async getProfiles() {
    var { stdout } = await exec("twilio profiles:list");
    let profiles = stdout.split("\n");
    // Remove first line (header)
    profiles.shift();
    // Remove last line (empty line )
    profiles.pop();
    profiles = profiles.map((row, index) => {
      let pairs = /(.*?) AC(.*?) /.exec(row);
      return {
        name: `${pairs[1].trim()} (${pairs[2].trim()})`,
        value: pairs[1].trim(),
        selected: row.indexOf(" true ") > -1,
      };
    });
    // Order alphabetically
    profiles.sort((a, b) => {
      return a.name < b.name ? -1 : 1;
    });
    return profiles;
  }

  async setProfile(profileName) {
    var { stdout, stderr } = await exec(
      `twilio profiles:use ${profileName}`
    );
    let parseOutput = /set (.*?) as active profile/.exec(stderr);
    if (parseOutput) {
      return `Set ${parseOutput[1]} as active profile`;
    } else {
      return "Error setting profile\n" + stderr;
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
