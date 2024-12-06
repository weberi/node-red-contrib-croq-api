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
    function CroqNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Retrieve node configurations
        node.apiKey = config.apiKey;
        node.apiEndpoint = config.apiEndpoint || '/openai/v1/chat/completions';
        node.defaultModel = config.defaultModel || 'llama3-70b-8192';
        node.defaultTemperature = parseFloat(config.defaultTemperature || 0.7);
        node.defaultMaxTokens = parseInt(config.defaultMaxTokens || 1024);

        node.on('input', function (msg, send, done) {
            // Extract values from the incoming message or use defaults
            const prompt = msg.prompt;
            const model = msg.model || node.defaultModel;
            const temperature = msg.temperature || node.defaultTemperature;
            const max_tokens = msg.max_tokens || node.defaultMaxTokens;
            const apiEndpoint = config.apiEndpoint || node.apiKey;    

            if (!node.apiKey) {
                node.error("API Key is required.");
                done("Missing API Key");
                return;
            }

            if (!prompt || typeof prompt !== 'object' || !prompt.messages) {
                node.error("Invalid prompt format. Ensure msg.prompt is a valid JSON object with a 'messages' array.");
                done("Invalid prompt");
                return;
            }

            if (!apiEndpoint) {
                node.error("API Endpoint is required. Please configure it in the node settings.");
                done("Missing API Endpoint");
                return;
            }

            const payload = JSON.stringify({
                model,
                temperature,
                max_tokens,
                ...prompt,
            });

            const options = {
                hostname: 'api.groq.com',
                path: apiEndpoint,
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${node.apiKey}`,
                    "Content-Length": Buffer.byteLength(payload),
                },
            };

            // Make the HTTPS request
            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const parsedData = JSON.parse(data);
                        msg.payload = parsedData; // Return API response
                        send(msg);
                        done();
                    } catch (err) {
                        node.error("Failed to parse Groq API response: " + err.message);
                        msg.error = err;
                        send(msg);
                        done(err);
                    }
                });
            });

            req.on('error', (err) => {
                node.error("Failed to connect to Groq API: " + err.message);
                msg.error = err;
                send(msg);
                done(err);
            });

            req.write(payload);
            req.end();
        });
    }

    RED.nodes.registerType("croq", CroqNode);
};
