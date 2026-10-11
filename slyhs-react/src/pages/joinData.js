/* Registration data + rules (from the SLYHS Join design). */
export const DISTRICTS = ['Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'];
export const STATUSES = ['School student', 'University student', 'Graduate', 'Working professional', 'Independent enthusiast'];
export const OPTS = {
  prefLang: ['Sinhala', 'Tamil', 'English'],
  interests: ['Snakes', 'Lizards', 'Turtles and tortoises', 'Crocodilians', 'Frogs and other amphibians', 'Ecology and habitats', 'Taxonomy', 'Snakebite and public health', 'Rescue and human-wildlife conflict', 'Photography', 'Education and outreach', 'Data and technology', 'Writing and communication'],
  experience: ['Complete beginner', 'Some knowledge', 'Experienced', 'Professional or researcher'],
  wantMentor: ['Yes', 'No', 'Not sure'],
  project: ['Yes', 'No', 'Planning one'],
  joiningAs: ['Member', 'Mentor', 'Partner organisation'],
  help: ['Attend talks', 'Join surveys', 'Rescue training', 'Research projects', 'Teaching and school outreach', 'Design and media', 'Website and technology', 'Translation (Sinhala, Tamil, English)', 'Fundraising', 'Organising events'],
  time: ['A few hours a month', 'A few hours a week', 'More'],
  resources: ['Field sites', 'Lab or equipment', 'Venue for meetings', 'Transport', 'Data or papers', 'Training'],
  helpLangs: ['Sinhala', 'Tamil', 'English', 'Other']
};
export const MULTI = { prefLang: true, interests: true, help: true, resources: true, helpLangs: true };
export const BLANK = {
  fullName: '', prefName: '', dob: '', email: '', phone: '+94 ', district: '', prefLang: [], status: '', org: '', field: '',
  interests: [], experience: '', researchFields: '', wantMentor: '', past: '', project: '',
  joiningAs: 'Member', help: [], time: '', resources: [], funding: '', helpLangs: [],
  gName: '', gRel: '', gPhone: '', gEmail: '', gConsent: false,
  ethics: false, wildlife: false, privacy: false, directory: false, newsletter: true, whatsapp: false, captcha: ''
};
export const TIERS = [
  { n: '01', name: 'Explorer', tag: 'Start here', kind: 'start', who: 'Ages 15 to 17, or complete beginners', can: 'Talks, workshops, supervised field walks, photo records' },
  { n: '02', name: 'Member', tag: 'Start here', kind: 'start', who: '18 or over, basic course completed', can: 'Surveys, data work, support at rescues under supervision' },
  { n: '03', name: 'Rescuer', tag: 'Earned', kind: 'earned', who: 'Certified, 6 months active, mentor sign-off', can: 'Lead rescues of non-venomous snakes and other reptiles' },
  { n: '04', name: 'Specialist', tag: 'Earned', kind: 'earned', who: 'Endorsed by a recognised expert', can: 'Venomous snake rescue, training, leading surveys' },
  { n: '05', name: 'Mentor', tag: 'By invitation', kind: 'invite', who: 'Academics, wildlife officers, doctors, experienced rescuers', can: 'Teach, review protocols, endorse promotions' }
];
export const PERKS = ['Monthly Herp Talks', 'A mentor matched to your interests', 'Supervised field walks & surveys', 'Rescue training pathway', 'District WhatsApp group'];

export const DRAFT_KEY = 'slyhs-join-draft';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ageOf(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d)) return null;
  const n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--;
  return a;
}

export function derive(d) {
  const age = ageOf(d.dob);
  const isMinor = age !== null && age >= 15 && age < 18;
  let tier = 'Member';
  let tierNote = 'Surveys, data work and supervised rescue support once you complete the basic course.';
  if (isMinor || d.experience === 'Complete beginner') {
    tier = 'Explorer';
    tierNote = isMinor ? 'Under-18 members are placed in Explorer automatically. Supervised activities only.' : 'Talks, workshops, supervised field walks and photo records.';
  }
  if (!isMinor && d.joiningAs === 'Mentor') { tier = 'Mentor'; tierNote = 'Pending committee review. We’ll be in touch.'; }
  return { isMinor, tier, tierNote, showOrg: /student|professional/i.test(d.status), showFunding: d.joiningAs !== 'Member' };
}

export function validate(step, d) {
  const e = {};
  const req = (k, m) => { if (!d[k] || (Array.isArray(d[k]) && !d[k].length)) e[k] = m; };
  if (step === 1) {
    req('fullName', 'Please enter your full name.');
    const a = ageOf(d.dob);
    if (!d.dob) e.dob = 'Please enter your date of birth.';
    else if (a === null || a > 100) e.dob = 'Please check this date.';
    else if (a < 15) e.dob = 'Members must be 15 or older. Ask a teacher about our school outreach.';
    if (!d.email) e.email = 'Please enter your email.';
    else if (!EMAIL_RE.test(d.email)) e.email = 'This email looks incomplete, e.g. name@example.com';
    if (d.phone.replace(/\D/g, '').length < 11) e.phone = 'Enter your number with the country code, e.g. +94 77 123 4567';
    req('district', 'Please choose your district.');
    req('prefLang', 'Pick at least one language.');
    req('status', 'Please choose your status.');
  }
  if (step === 2) {
    req('interests', 'Pick at least one area.');
    req('experience', 'Please choose your experience level.');
    req('wantMentor', 'Please choose an answer.');
  }
  if (step === 4) {
    if (derive(d).isMinor) {
      req('gName', "Enter your parent or guardian's name.");
      req('gRel', 'Enter their relationship to you.');
      if (d.gPhone.replace(/\D/g, '').length < 9) e.gPhone = 'Enter a phone number.';
      if (!EMAIL_RE.test(d.gEmail)) e.gEmail = 'Enter a valid email.';
      if (!d.gConsent) e.gConsent = 'Required';
    }
    if (!d.ethics) e.ethics = 'Required';
    if (!d.wildlife) e.wildlife = 'Required';
    if (!d.privacy) e.privacy = 'Required';
    if (String(d.captcha).trim() !== '7') e.captcha = 'That answer isn’t right. Try again.';
  }
  return e;
}

export { registerMember as submitRegistration } from '../lib/api';

/** "Sinhala", "Sinhala and Tamil", "Sinhala, Tamil and English" */
export function listLanguages(langs) {
  const l = Array.isArray(langs) && langs.length ? langs : ['English'];
  return l.length === 1 ? l[0] : l.slice(0, -1).join(', ') + ' and ' + l[l.length - 1];
}
