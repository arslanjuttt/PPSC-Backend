const asyncHandler = require('../utils/asyncHandler');
const chatService = require('../services/chat.service');

const generateChatReply = asyncHandler(async (req, res) => {
  const result = await chatService.generateChatReply(req);
  res.status(200).json(result);
});

module.exports = {
  generateChatReply,
};
