/**
 * Auto-generated TypeScript types for locale data
 *
 * DO NOT EDIT MANUALLY - This file is auto-generated
 */

export interface LocaleStructure {
  common: {
    back: string;
    backToAllCases: string;
    change: string;
    remove: string;
    save: string;
    cancel: string;
    yes: string;
    no: string;
    error: string;
    warning: string;
    errorSummaryTitle: string;
    status: {
      new: string;
      opened: string;
      accepted: string;
      closed: string;
    };
  };
  navigation: {
    mainNav: {
      yourCases: string;
      search: string;
    };
    footer: {
      help: string;
      feedback: string;
      updates: string;
      privacyPolicy: string;
      cookiePolicy: string;
      accessibility: string;
    };
  };
  components: {
    table: {
      noData: string;
      columns: {
        name: string;
        caseId: string;
        dateOfBirth: string;
        details: string;
        dateModified: string;
        dateClosed: string;
        dateReceived: string;
        phoneNumber: string;
        status: string;
        lastModified: string;
      };
    };
  };
  pages: {
    home: {
      underConstruction: string;
    };
    yourCases: {
      newCases: string;
      openedCases: string;
      acceptedCases: string;
      closedCases: string;
      pageTitles: {
        new: string;
        opened: string;
        accepted: string;
        closed: string;
      };
    };
    caseDetails: {
      dateReceived: string;
      laaReference: string;
      notProvided: string;
      tabs: {
        clientDetails: string;
        scope: string;
        financialEligibility: string;
        notesAndHistory: string;
      };
      clientDetails: {
        heading: string;
        aboutClient: string;
        contactDetails: string;
        thirdPartyContact: string;
      };
      buttons: {
        acceptCase: string;
        rejectCase: string;
        splitCase: string;
        closeCase: string;
        leaveFeedback: string;
        generateLegalHelpForm: string;
        reopenCase: string;
        addThirdPartyContact: string;
      };
    };
    error: {
      pageTitle: string;
    };
    search: {
      heading: string;
      intro: string;
      caseDetailsHeading: string;
      searchHint: {
        intro: string;
        items: {
          caseId: string;
          phoneNumber: string;
          name: string;
          postcode: string;
          address: string;
        };
      };
      inputLabel: string;
      statusLabel: string;
      statusOptions: {
        all: string;
      };
      searchButtonText: string;
      clearLink: string;
      noResults: {
        heading: string;
        body: string;
      };
    };
  };
  forms: {
    clientDetails: {
      name: {
        label: string;
        title: string;
        pageTitle: string;
      };
      dateOfBirth: {
        label: string;
        legend: string;
        pageTitle: string;
        hint: string;
        validationError: {
          day: {
            notEmpty: string;
            isInt: string;
          };
          month: {
            notEmpty: string;
            isInt: string;
          };
          year: {
            notEmpty: string;
            isLength: string;
            isInt: string;
          };
          validDate: string;
          dateInPast: string;
          notChanged: string;
        };
      };
      email: {
        label: string;
        title: string;
        pageTitle: string;
      };
      phoneNumber: {
        label: string;
        title: string;
        pageTitle: string;
        safeToCall: string;
        announceCall: string;
        notSafeToCall: string;
        doNotAnnounce: string;
        validationError: {
          invalidFormat: string;
          notEmpty: {
            summaryMessage: string;
            inlineMessage: string;
          };
          notChanged: string;
        };
      };
      address: {
        label: string;
        title: string;
        pageTitle: string;
        postcode: string;
        validationError: {
          notChanged: string;
        };
      };
      language: {
        label: string;
      };
      reasonableAdjustments: {
        label: string;
      };
      thirdParty: {
        name: string;
        address: string;
        contactNumber: string;
        emailAddress: string;
        relationshipToClient: string;
        passphrase: string;
        notSafeToCall: string;
        passphraseNotSetUp: string;
      };
    };
    search: {
      validationError: {
        notEmpty: string;
      };
    };
  };
  accessibility: {
    visuallyHiddenText: {
      changeName: string;
      changeDateOfBirth: string;
      changePhoneNumber: string;
      changeEmail: string;
      changeAddress: string;
      changeLanguage: string;
      changeReasonableAdjustments: string;
      changeThirdPartyContact: string;
      removeThirdPartyContact: string;
    };
  };
}
