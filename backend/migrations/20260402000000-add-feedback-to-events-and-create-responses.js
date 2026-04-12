'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add columns to Events
    await queryInterface.addColumn('Events', 'isFeedbackEnabled', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    
    await queryInterface.addColumn('Events', 'feedbackQuestions', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // 2. Create FeedbackResponses table
    await queryInterface.createTable('FeedbackResponses', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      eventId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Events',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      answers: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('FeedbackResponses');
    await queryInterface.removeColumn('Events', 'feedbackQuestions');
    await queryInterface.removeColumn('Events', 'isFeedbackEnabled');
  }
};
