'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Events', 'feedbackTitle', {
      type: Sequelize.STRING,
      defaultValue: 'Event Feedback',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Events', 'feedbackTitle');
  }
};
