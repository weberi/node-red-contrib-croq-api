/* 
node-red-contrib-croq-api v1.0.0
Copyright (c) 2024 Irene Weber

MIT License (http://www.opensource.org/licenses/mit-license.php)
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

const https = require('https');

module.exports = function (RED) {
    function ModelsNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

     // Retrieve node configurations
        node.apiKey = config.apiKey;
        node.apiEndpoint = config.apiEndpoint || '/openai/v1/models';

        // Fetch the list of models
        function fetchModels(apiKey, send, done) {
            const options = {
                hostname: 'api.groq.com',
                path:  node.apiEndpoint,
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${apiKey}`
                }
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    const msg = {
                        payload: {
                            statusCode: res.statusCode,
                            headers: res.headers,
                            body: null,
                        }
                    };

                    try {
                        if (data) {
                            msg.payload.body = JSON.parse(data);
                        }
                    } catch (error) {
                        node.error("Failed to parse response body: " + error.message);
                        msg.payload.body = data; // Raw response in case of parsing error
                    }

                    // Emit the full response, regardless of success or error
                    send(msg);
                    done();
                });
            });

            req.on('error', (err) => {
                const msg = {
                    payload: {
                        statusCode: null,
                        headers: null,
                        body: err.message
                    }
                };
                node.error("API request failed: " + err.message);
                send(msg);
                done(err);
            });

            req.end();
        }

        // Node functionality
        this.on('input', function (msg, send, done) {
            const apiKey = msg.apiKey || node.apiKey;

            if (!apiKey) {
                const error = new Error("API Key is required. Please configure it in the node settings or pass it via msg.apiKey.");
                node.error(error.message);
                done(error);
                return;
            }

            fetchModels(apiKey, send, done);
        });

        // Automatically trigger node functionality
        RED.httpAdmin.post("/inject/:id", RED.auth.needsPermission("inject.write"), function (req, res) {
            const nodeInstance = RED.nodes.getNode(req.params.id);
            if (nodeInstance) {
                try {
                    nodeInstance.emit("input", {}); // Trigger the input event
                    res.sendStatus(200);
                } catch (err) {
                    res.status(500).send("Failed to trigger inject: " + err.message);
                }
            } else {
                res.status(404).send("Node not found.");
            }
        });
    }

    RED.nodes.registerType("models", ModelsNode);
};







// const https = require('https');

// module.exports = function (RED) {
//     function ModelsNode(config) {
//         RED.nodes.createNode(this, config);
//         const node = this;

//         // Retrieve node configurations
//         node.apiKey = config.apiKey;
//         node.apiEndpoint = config.apiEndpoint || '/openai/v1/models';
   

//         // Fetch the list of models
//         function fetchModels(apiKey, send, done) {
//             const options = {
//                 hostname: 'api.groq.com',
//                 path: 'node.apiEndpoint',
//                 method: 'GET',
//                 headers: {
//                     "Authorization": `Bearer ${apiKey}`
//                 }
//             };

//             const req = https.request(options, (res) => {
//                 let data = '';

//                 res.on('data', (chunk) => {
//                     data += chunk;
//                 });

//                 res.on('end', () => {
//                     if (res.statusCode === 200) {
//                         try {
//                             const models = JSON.parse(data).data;
//                             // Sort models by their ID
//                             models.sort((a, b) => a.id.localeCompare(b.id));
//                             const msg = { payload: models };
//                             send(msg);
//                             done();
//                         } catch (error) {
//                             node.error("Failed to parse model list: " + error.message);
//                             done(error);
//                         }
//                     } else {
//                         node.error("API request failed. Status Code: " + res.statusCode);
//                         done(new Error("API request failed."));
//                     }
//                 });
//             });

//             req.on('error', (err) => {
//                 node.error("Failed to connect to Groq API: " + err.message);
//                 done(err);
//             });

//             req.end();
//         }

//         // Node functionality
//         this.on('input', function (msg, send, done) {
//             const apiKey = msg.apiKey || node.apiKey;
//             if (!apiKey) {
//                 node.error("API Key is required. Please configure it in the node settings or pass it via msg.apiKey.");
//                 done("Missing API Key");
//                 return;
//             }
//             fetchModels(apiKey, send, done);
//         });

//         // Automatically trigger node functionality
//         this.on('close', function () {
//             if (this.onceTimeout) {
//                 clearTimeout(this.onceTimeout);
//             }
//         });

//         RED.httpAdmin.post("/inject/:id", RED.auth.needsPermission("inject.write"), function (req, res) {
//             const nodeInstance = RED.nodes.getNode(req.params.id);
//             if (nodeInstance != null) {
//                 try {
//                     const msg = { apiKey: nodeInstance.apiKey };
//                     nodeInstance.emit("input", msg);
//                     res.sendStatus(200);
//                 } catch (err) {
//                     res.sendStatus(500);
//                     nodeInstance.error("Failed to trigger inject: " + err.toString());
//                 }
//             } else {
//                 res.sendStatus(404);
//             }
//         });
//     }

//     RED.nodes.registerType("models", ModelsNode);
// };
