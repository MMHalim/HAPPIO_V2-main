export default {
  
  // Calculate total score based on all criteria
  calculateTotalScore: () => {
    const communicationScore = CommunicationRadio.selectedOptionValue || 0;
    const professionalismScore = ProfessionalismRadio.selectedOptionValue || 0;
    const knowledgeScore = KnowledgeRadio.selectedOptionValue || 0;
    const resolutionScore = ResolutionRadio.selectedOptionValue || 0;
    
    const totalScore = (parseInt(communicationScore) + 
                      parseInt(professionalismScore) + 
                      parseInt(knowledgeScore) + 
                      parseInt(resolutionScore)) / 4;
    
    return Math.round(totalScore);
  },

  // Validate form before submission
  validateForm: () => {
    if (!ConversationID.text) {
      showAlert('Please enter Conversation ID');
      return false;
    }
    if (!AgentName.selectedOptionValue) {
      showAlert('Please select an agent');
      return false;
    }
    if (!CommunicationRadio.selectedOptionValue) {
      showAlert('Please score Communication Skills');
      return false;
    }
    return true;
  },

  // Submit scorecard data to Supabase
  submitScorecard: async () => {
    if (!ModernScorecard.validateForm()) {
      return;
    }

    try {
      // Call the modern API to submit scorecard
      await SubmitScorecard_Modern.run();
      
      // Show success message
      showAlert('🎉 Scorecard submitted successfully to Supabase!', 'success');
      
      // Reset form
      ModernScorecard.resetForm();
      
      // Navigate back to main Dashboard so MTD rankings remain the hub
      navigateTo("Dashboard");
      
    } catch (error) {
      console.error('Scorecard submission error:', error);
      showAlert('❌ Failed to submit scorecard. Please try again.', 'error');
    }
  },

  // Reset form
  resetForm: () => {
    ConversationID.setValue("");
    AgentName.setSelectedOption("");
    TakerName.setValue("");
    ConversationURL.setValue("");
    CommunicationRadio.setSelectedOption("");
    CommunicationComment.setValue("");
    ProfessionalismRadio.setSelectedOption("");
    ProfessionalismComment.setValue("");
    KnowledgeRadio.setSelectedOption("");
    KnowledgeComment.setValue("");
    ResolutionRadio.setSelectedOption("");
    ResolutionComment.setValue("");
    AgentEmail.setValue("");
    MonitoringType.setSelectedOption("");
    CertificationRadio.setSelectedOption("");
  },

  // Get agent email for notifications
  getAgentEmail: () => {
    const selectedAgent = AgentName.selectedOptionValue;
    // This would typically query the database for agent email
    // For now, return a placeholder
    return selectedAgent ? `${selectedAgent.toLowerCase().replace(' ', '.')}@tempo.fit` : "";
  }
}
