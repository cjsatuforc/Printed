'use strict';
var Alexa = require("alexa-sdk");
var request = require("request")
var fs = require("fs")

var data = fs.readFileSync("settings.json")
data = (JSON.parse(data))
console.log(data)

var API_KEY = data.key
var ROOT_URL = data.url

// var options = {
//     url: "settings.json",
//     method: "GET"
// }
// request.get(options)
//     data = ""
//     .on('response', function (res) {
//         console.log("Got a repsponse", res.statusCode)
//     }).on('data', function(chunk){
//         data += chunk
//     }).on('end', function(){
//         console.log(JSON.parse(data))
//     })

// For detailed tutorial on how to making a Alexa skill,
// please visit us at http://alexa.design/build
function shuffle(array) {
    var i = 0, j = 0, temp = null

    for (i = array.length - 1; i > 0; i -= 1) {
        j = Math.floor(Math.random() * (i + 1))
        temp = array[i]
        array[i] = array[j]
        array[j] = temp
    }
}
var affirmatives = [
    "Got it, boss.",
    "Sure thing.",
    "Got it.",
    "On it",
    "Doing that now.",
    "Running, need anything else?",
    "Want me to do the laundry too?",
    "Why don't I do the dishes while I'm at it?",
    "No, you. Just kidding.",
    "Okie Dokie Artichoke-e.",
    "Ten four good buddy.",
    "OK.",
    "Count it on.",
    "Your will be done!",
    "As you wish."
]

exports.handler = function (event, context) {
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        this.emit('AutoHome');
    },
    'CancelIntent': function () {
        this.emit('Cancel')
    },
    'CoolDownIntent': function () {
        this.emit("CoolDown")
    },
    'PreHeatIntent': function () {
        this.emit('PreHeat')
    },
    'AutoHomeIntent': function () {
        this.emit('AutoHome');
    },
    'EStopIntent': function () {
        this.emit('EmergencyStop');
    },
    'ListFilesIntent': function () {
        this.emit('ListFiles');
    },
    'PrintFileIntent': function () {
        this.emit('PrintFile');
    },
    'TimeLeftIntent': function () {
        this.emit('TimeLeft');
    },
    'AutoHome': function () {
        var that = this
        var options = {
            url: ROOT_URL + "printer/printhead",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Api-Key": API_KEY
            },
            json: {
                "command": "home",
                "axes": ["x", "y", "z"]
            }
        }
        request.post(options.url, options)
            .on('response', function (res) {
                // console.log(res)
                that.response.speak(affirmatives[Math.floor(Math.random() * affirmatives.length)] + ". Homing.")
                that.emit(":responseReady")
            }).on('error', function (err) {
                // console.log(err)
                that.response.speak("We're Bad!")
                that.emit(":responseReady")
            })
    },
    'EmergencyStop': function () {
        var that = this
        var options = {
            url: ROOT_URL + "printer/command",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Api-Key": API_KEY
            },
            json: {
                "command": "M112"
            }
        }
        request.post(options.url, options)
            .on('response', function (res) {
                // console.log(res)
                that.response.speak("Stopping Printer")
                that.emit(":responseReady")
            }).on('error', function (err) {
                // console.log(err)
                that.response.speak("YOU CANT STOP THE MADNESS")
                that.emit(":responseReady")
            })
    },
    'CoolDown': function () {
        var that = this
        var options = {
            url: ROOT_URL + "printer/command",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Api-Key": API_KEY
            },
            json: {
                "commands": [
                    "M104 S0",
                    "M140 S0"
                ]
            }
        }
        request.post(options.url, options)
            .on('response', function (res) {
                // console.log(res)
                that.response.speak(affirmatives[Math.floor(Math.random() * affirmatives.length)] + ". Cooling Down.")
                that.emit(":responseReady")
            }).on('error', function (err) {
                // console.log(err)
                that.response.speak("We're Bad!")
                that.emit(":responseReady")
            })
    },
    'TimeLeft': function () {
        var that = this
        var options = {
            url: ROOT_URL + "job",
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-Api-Key": API_KEY
            }
        }
        var data = ""
        request.get(options)
            .on('response', function (res) {
                res.setEncoding('utf8')
            }).on('data', function (chunk) {
                data += chunk
            }).on('end', function () {
                var getBetterTime = function (s) {
                    var hours = Math.floor(s / 3600);
                    var minutes = Math.floor(s / 60) - 60 * hours
                    var seconds = Math.floor(s) - (3600 * hours) - (60 * minutes)

                    if (hours > 0) {
                        return "roughly " + hours + " hours and " + Math.floor(minutes / 15) * 15 + " minutes"
                    } else
                        return "about " + Math.floor(minutes / 5) * 5 + " minutes"
                }
                data = JSON.parse(data)
                var resp = ""
                if (!data)
                    resp = "Looks like a whole lot of nothing"
                else if (data.state === "Printing")
                    resp = `The ${data.job.file.display.split(".")[0]} job currenty has ${getBetterTime(data.progress.printTimeLeft)} left`
                else
                    resp = "Looks like a whole lot of nothing"
                that.response.speak(resp)
                that.emit(":responseReady")
            })

    },
    'ListFiles': function () {
        var that = this
        var options = {
            url: ROOT_URL + "files",
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-Api-Key": API_KEY
            }
        }
        var data = ""
        request.get(options)
            .on('response', function (res) {
                res.setEncoding('utf8')
            }).on('data', function (chunk) {
                data += chunk
            }).on('end', function () {
                data = JSON.parse(data)
                var resp = ""
                if (data.files) {
                    var f = [];
                    data.files.forEach(function (file) {
                        if (file.type == "model")
                            f.push(file)
                    }, this);
                    shuffle(f)
                    resp += affirmatives[Math.floor(Math.random() * affirmatives.length)]
                    resp += `. There are ${f.length} files saved to the Printer. `
                    resp += `Some examples are `;
                    shuffle(f);
                    for (var i = 0; i < 5 && i < f.length; i++) {
                        resp += `${f[i].path.split(".")[0]}, `
                    }
                    resp += `. For example, you can say 'alexa, tell the printer to print ${f[1].path.split(".")[0]}'.`

                }
                that.response.speak(resp)
                that.emit(":responseReady")
            })

    },
    'PrintFile': function () {
        var that = this
        var file_name = this.event.request.intent.slots.file.value
        var options = {
            url: ROOT_URL + "files",
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-Api-Key": API_KEY
            }
        }
        var response_string = ""
        request.get(options)
            .on('response', function (res) {
                res.setEncoding('utf8')
                // console.log(res)
                that.response.speak("Trying to look for files now")
            }).on('data', function (chunk) {
                response_string += chunk
            }).on('error', function (err) {
                // console.log(err)
                that.response.speak("Look's like the directories are empty!")
                that.emit(":responseReady")
            }).on('end', function () {
                var response_data = JSON.parse(response_string)
                // console.log(response_data)
                var print_file = ""
                if (response_data.files.length > 0) {
                    response_data.files.forEach(function (file) {
                        if (file_name === file.display.split(".")[0].toLowerCase() && file.type === 'machinecode') {
                            print_file = file.path
                        }

                    }, this);
                    if (!print_file)
                        response_data.files.forEach(function (file) {
                            if (file_name === file.display.split(".")[0].toLowerCase() && file.type === 'model') {
                                print_file = file.path
                            }

                        }, this);
                    if (!print_file) {
                        that.response.speak(`Couldn't Find Any Files matching ${file_name}. Look on Thingiverse you ninny`)
                        that.emit(":responseReady")
                    } else if (print_file.includes(".stl")) {
                        var options = {
                            url: ROOT_URL + "files/local/" + print_file,
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "X-Api-Key": API_KEY
                            },
                            json: {
                                "command": "slice",
                                "slicer": "cura",
                                "gcode": file_name + ".gco",
                                "printerProfile": "AnyCubic",
                                "profile": "AnyCubic",
                                "profile.infill": 75,
                                "profile.fill_density": 15,
                                "position": { "x": 0, "y": 0 },
                                "print": true
                            }
                        }
                        var data_good = false
                        request.post(options)
                            .on('response', function (res) {
                                console.log(res)
                                if (res.statusCode != 409) {
                                    data_good = true
                                    print_file = file_name
                                }
                            })
                            .on('end', function () {
                                if (data_good) {
                                    that.response.speak(`Starting to print ${print_file}!`)
                                    that.emit(":responseReady")
                                } else {
                                    that.response.speak(`The printer could not slice ${print_file}`)
                                    that.emit(":responseReady")
                                }

                            })
                    } else if (print_file.includes(".gco")) {
                        var options = {
                            url: ROOT_URL + "files/local/" + print_file,
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "X-Api-Key": API_KEY
                            },
                            json: {
                                "command": "select",
                                "print": true
                            }
                        }
                        request.post(options)
                            .on('response', function (res) {
                                console.log(res)
                                if (res.statusCode != 409) {
                                    that.response.speak(`Starting ${print_file.split(".")[0]}!`)
                                    that.emit(":responseReady")
                                } else {
                                    that.response.speak(`The printer is not operational`)
                                    that.emit(":responseReady")
                                }
                            })
                    }
                } else {
                    that.response.speak("Look's like the directories are empty!")
                    that.emit(":responseReady")
                }
            })
    },
    'PreHeat': function () {
        var that = this
        var options = {
            url: ROOT_URL + "printer/command",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Api-Key": API_KEY
            },
            json: {
                "commands": [
                    "M104 S205",
                    "M140 S50",
                ]
            }
        }
        request.post(options.url, options)
            .on('response', function (res) {
                // console.log(res)
                that.response.speak(affirmatives[Math.floor(Math.random() * affirmatives.length)] + ". Preheating Printer")
                that.emit(":responseReady")
            }).on('error', function (err) {
                // console.log(err)
                that.response.speak("I can't do that, John.")
                that.emit(":responseReady")
            })
    },
    'Cancel': function () {
        var that = this
        var options = {
            url: ROOT_URL + "printer/command",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Api-Key": API_KEY
            },
            json: {
                "commands": [
                    "M0",
                    "G4 P2",
                    "M140 S0",
                    "M104 S0",
                    "G28",
                ]
            }
        }
        request.post(options.url, options)
            .on('error', function (err) {
                // console.log(err)
                that.response.speak("I can't do that, John.")
                that.emit(":responseReady")
            }).on('end', function () {
                var options = {
                    url: ROOT_URL + "job",
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Api-Key": API_KEY
                    },
                    json: {
                        "command": "cancel"
                    }
                }
                request.post(options).on('end', function () {
                    that.response.speak(affirmatives[Math.floor(Math.random() * affirmatives.length)] + ". Cancelling Print.")
                    that.emit(":responseReady")
                })
            })
    },
    'SessionEndedRequest': function () {
        console.log('Session ended with reason: ' + this.event.request.reason);
    },
    'AMAZON.StopIntent': function () {
        this.response.speak('Bye');
        this.emit(':responseReady');
    },
    'AMAZON.HelpIntent': function () {
        this.response.speak("You can try: 'alexa, hello world' or 'alexa, ask hello world my" +
            " name is awesome Aaron'");
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function () {
        this.response.speak('Bye');
        this.emit(':responseReady');
    },
    'Unhandled': function () {
        this.response.speak("Sorry, I didn't get that. You can try: 'alexa, hello world'" +
            " or 'alexa, ask hello world my name is awesome Aaron'");
    }
};
