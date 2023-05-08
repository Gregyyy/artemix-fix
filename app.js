const fs = require('fs');

const jwt = ""

async function getExercises(type) {
    const response = await fetch("https://artemis.praktomat.cs.kit.edu/api/courses/17/" + type + "/", {
        "headers": {
            "Cookie": "jwt=" + jwt
        }
    });

    return await response.json()
}

async function getParticipants(exerciseId) {
    const response = await fetch("https://artemis.praktomat.cs.kit.edu/api/exercises/" + exerciseId + "/participations?withLatestResults=true", {
        "headers": {
            "Cookie": "jwt=" + jwt
        }
    });

    return await response.json()
}

async function getSubmissions(participantId) {
    try {
        const response = await fetch("https://artemis.praktomat.cs.kit.edu/api/participations/" + participantId + "/submissions", {
            "headers": {
                "Cookie": "jwt=" + jwt
            }
        })

        return await response.json()
    } catch (e) {
    }

    return null;
}

async function getTutorialGroups() {
    const response = await fetch("https://artemis.praktomat.cs.kit.edu/api/courses/17/tutorial-groups", {
        "headers": {
            "Cookie": "jwt=" + jwt
        }
    });

    return await response.json()
}

const types = ["text-exercises", "modeling-exercises", "programming-exercises", "file-upload-exercises"]

const exerciseMap = new Map()
const exerciseList = []

if (jwt === "") {
    console.error("Please set your jwt in app.js")
    return
}

getAllExercises().then(r => console.log("Finished"));

async function getAllExercises() {

    for (let type of types) {
        console.log("current type", type)

        const exercises = await getExercises(type)
        for (let exercise of exercises) {
            const exerciseId = exercise.id
            console.log("current exercise", exercise.title)

            const urlMap = new Map()
            const participants = await getParticipants(exerciseId)
            for (let participant of participants) {
                let participantId = participant.id
                const submissions = await getSubmissions(participantId)
                if (submissions != null) {
                    if (submissions.length > 0) {
                        const lastSubmission = submissions[submissions.length - 1].id
                        const url = "https://artemis.praktomat.cs.kit.edu/course-management/17/text-exercises/" + exerciseId +
                            "/participations/" + participantId + "/submissions/" + lastSubmission + "/assessment"
                        urlMap.set(participant.student.login, url)
                    }
                }
            }

            exerciseMap.set(exercise.title, urlMap)
            exerciseList.push(exercise.title)
        }
    }

    groupByTutorialGroup()
}

function groupByTutorialGroup() {
    console.log("Grouping by tutorial groups ...")

    getTutorialGroups().then(data => {
        for (let tutorialGroup of data) {
            const groupName = tutorialGroup.title
            const participants = tutorialGroup.registrations

            console.log("current group", groupName)

            let content = ""

            for (let exerciseName of exerciseList) {
                const map = exerciseMap.get(exerciseName)

                let exerciseContent = ""

                exerciseContent += "-- " + exerciseName + "\n"

                let found = false
                for (let participant of participants) {
                    const login = participant.student.login
                    if (map.has(login)) {
                        exerciseContent += login + " " + map.get(login) + "\n"
                        found = true
                    }
                }

                if (found) {
                    content += exerciseContent + "\n"
                }
            }

            fs.writeFile(groupName + '.txt', content, function (err) {
                if (err) return console.log(err);
                console.log('Saved file');
            });
        }
    });
}

