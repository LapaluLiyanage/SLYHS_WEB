// Draft policy text for the Sri Lankan Young Herpetologists' Society (SLYHS).
// Written as a starting point: the founding committee should review it before it is treated as final.
const UPDATED = 'October 2026';

export const POLICIES = {
  privacy: {
    title: 'Privacy Policy',
    updated: UPDATED,
    lead: 'We collect only what we need to run the society, we keep it safe, and we never sell it.',
    sections: [
      ['What we collect', [
        'When you join, we ask for your name, email address, date of birth, district, phone or WhatsApp number (if you give one), your experience and interests, and your preferred language. For members under 18 we also ask for a parent or guardian\'s name, relationship, email and phone number, and their consent.',
        'If you subscribe to the newsletter, we collect your email address only.'
      ]],
      ['Why we collect it', [
        'To register you, place you in the right membership tier, contact you about meetings, events and the society, and keep you safe at activities. Your date of birth is used to work out your tier and whether guardian consent is needed.',
        'We use your preferred language and name when we write to you.'
      ]],
      ['Who can see it', [
        'Only the committee members who need it to run the society. We do not sell or rent your details. We do not share them with other organisations without your consent, except where the law requires it.',
        'Your data is stored with our database provider (Supabase), which processes it on our behalf. The public website cannot read the member list.'
      ]],
      ['Members directory', [
        'We show your name in a members directory only if you tick the box that allows it. You can change this at any time.'
      ]],
      ['Rare species and locations', [
        'Any location or sighting you share with us is treated as sensitive. We do not publish the locations of rare or threatened species.'
      ]],
      ['Children', [
        'We handle the information of members under 18 with extra care and only with a parent or guardian\'s consent. See our Child Safeguarding policy.'
      ]],
      ['How long we keep it', [
        'We keep your details while you are a member. If you leave or ask us to delete your data, we remove it, except for what we must keep for legal or safety reasons.'
      ]],
      ['Your rights', [
        'You can ask to see, correct or delete your information, or to stop emails, at any time. We follow the principles of Sri Lanka\'s Personal Data Protection Act, No. 9 of 2022. To make a request, email the address below.'
      ]],
      ['Cookies and analytics', [
        'This website stores a small draft of your registration form and your language choice on your own device so you do not lose your place. We do not use advertising cookies.'
      ]]
    ]
  },

  ethics: {
    title: 'Code of Ethics',
    updated: UPDATED,
    lead: 'Look, photograph, record. Never harm. Everyone who joins the society agrees to this code.',
    sections: [
      ['Animals come first', [
        'We observe wildlife without disturbing it. We do not capture, handle, chase, tease or kill reptiles or amphibians, and we do not take them from the wild or keep them as pets.',
        'We keep a safe distance from all snakes. Many are harmless, but we never assume. Venomous snakes are only ever dealt with by trained and authorised people.'
      ]],
      ['Safety', [
        'We do not put ourselves or others at risk for a photo. We carry a torch at night, wear suitable footwear, tell someone where we are going and follow the guidance in our first-aid guide.',
        'Children and young members are always accompanied by a responsible adult on field activities.'
      ]],
      ['Law and permission', [
        'We follow Sri Lankan law, including the Fauna and Flora Protection Ordinance, and the rules of the Department of Wildlife Conservation and the Forest Department. We get permits and landowner permission before surveys or research in protected areas or on private land.'
      ]],
      ['Habitats and rare species', [
        'We leave habitats as we found them: no moving logs and rocks without putting them back, no litter. We do not share the exact locations of rare, threatened or collected species, online or offline.'
      ]],
      ['Honest science', [
        'Records, photos and data are accurate and honestly labelled. We credit other people\'s photos and work, and we say when we are not sure of an identification.'
      ]],
      ['Respect for people', [
        'We treat every member and community with respect, whatever their language, background, age or experience. Harassment, bullying and discrimination are not accepted. We respect the people who live where we work and ask before photographing them.'
      ]],
      ['Social media', [
        'We post responsibly. We do not post content that shows animals being harmed or handled unsafely, and we remove location details from posts about sensitive species.'
      ]],
      ['If something goes wrong', [
        'Tell the committee. Breaking this code can lead to a warning, suspension or removal from the society, depending on how serious it is.'
      ]]
    ]
  },

  safeguarding: {
    title: 'Child Safeguarding',
    updated: UPDATED,
    lead: 'Young people are at the heart of the society. Keeping them safe is part of everything we do.',
    sections: [
      ['Our commitment', [
        'Every child and young person has the right to be safe. We will not tolerate abuse, neglect, bullying or exploitation in any society activity, online or in person.'
      ]],
      ['Joining as a member under 18', [
        'Students aged 7 and over can join. Members under 18 need the consent of a parent or guardian when they register. We ask for the guardian\'s details and keep them private.',
        'Children aged 7 to 14 join as Junior Explorers. They take part only in talks, workshops and walks designed for their age, and a parent, guardian or teacher stays with them at every activity. Junior Explorers never handle wildlife.'
      ]],
      ['Activities', [
        'Field walks and meetings for young members are led by more than one adult, and an adult is never alone with a single child. Parents and guardians are told where and when an activity takes place. Trips to wild places include a safety briefing and the first-aid guide.',
        'Anyone who works with children for the society must agree to this policy, and the committee will check their suitability before they take the role.'
      ]],
      ['Online safety', [
        'Adults do not message children privately. Contact with young members goes through group channels that guardians know about, or through the guardian. We do not share photos of children without a guardian\'s permission.'
      ]],
      ['Photos and personal details', [
        'We never publish a child\'s full name together with their photo, address or school, and we never share their location.'
      ]],
      ['If you are worried', [
        'If you think a child is at risk or has been harmed, tell a committee member straight away, or email the address below. In an emergency, contact the police (119) or the National Child Protection Authority hotline (1929).',
        'We take every concern seriously, treat it confidentially, and will not punish anyone for raising a concern in good faith.'
      ]]
    ]
  }
};
