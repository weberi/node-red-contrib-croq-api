/* 
node-red-contrib-croq-api v1.0.0
Copyright (c) 2024 Irene Weber

MIT License (http://www.opensource.org/licenses/mit-license.php)
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

module.exports = function (RED) {
    function PromptNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.name = config.name || "prompt";
        node.messages = config.messages;

        node.on("input", function (msg, send, done) {
            try {
                // Initialize the prompt object
                msg.prompt = {
                    messages: [],
                };

                // Add configured messages
                node.messages.forEach(function (message) {
                    const role = message.role;
                    const content = message.content;
                    if (role && content) {
                        msg.prompt.messages.push({
                            role: role,
                            content: RED.util.evaluateNodeProperty(content, message["content-type"], node, msg),
                        });
                    }
                });

                // Send updated message
                send(msg);
                done();
            } catch (err) {
                node.error("Error constructing prompt: " + err.message, msg);
                done(err);
            }
        });
    }

    RED.nodes.registerType("prompt", PromptNode);
};
