'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Events', 'feedbackSessions', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    
    await queryInterface.addColumn('FeedbackResponses', 'sessionName', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'General',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Events', 'feedbackSessions');
    await queryInterface.removeColumn('FeedbackResponses', 'sessionName');
  }
};
