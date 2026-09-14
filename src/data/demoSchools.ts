import { School } from '../types';

export const INITIAL_DEMO_SCHOOLS: School[] = [
  {
    id: 'sch_delhi_public',
    name: 'Delhi Public School, R.K. Puram',
    teamName: 'CyberVanguard',
    teamNumber: 'BRL-26-01',
    city: 'New Delhi, DL',
    students: ['Aarav Sharma', 'Ananya Gupta', 'Rohan Verma'],
    isActive: true
  },
  {
    id: 'sch_mothers_int',
    name: "The Mother's International School",
    teamName: 'PulseMechanica',
    teamNumber: 'BRL-26-02',
    city: 'New Delhi, DL',
    students: ['Ishaan Nair', 'Meera Kapoor', 'Aditya Sen'],
    isActive: true
  },
  {
    id: 'sch_bombay_scottish',
    name: 'Bombay Scottish School',
    teamName: 'TitanForge 9',
    teamNumber: 'BRL-26-03',
    city: 'Mumbai, MH',
    students: ['Kabir Deshmukh', 'Sara Merchant', 'Vivaan Joshi'],
    isActive: true
  },
  {
    id: 'sch_kv_iit_powai',
    name: 'Kendriya Vidyalaya IIT Powai',
    teamName: 'Vidyut CyberBots',
    teamNumber: 'BRL-26-04',
    city: 'Mumbai, MH',
    students: ['Priya Pillai', 'Nikhil Kulkarni', 'Siddharth Rao'],
    isActive: true
  },
  {
    id: 'sch_nps_blr',
    name: 'National Public School, Indiranagar',
    teamName: 'QuantumRobotics',
    teamNumber: 'BRL-26-05',
    city: 'Bengaluru, KA',
    students: ['Dhruv Menon', 'Diya Nambiar', 'Pranav Hegde'],
    isActive: true
  },
  {
    id: 'sch_modern_school',
    name: 'Modern School, Barakhamba Road',
    teamName: 'IronClaw Legion',
    teamNumber: 'BRL-26-06',
    city: 'New Delhi, DL',
    students: ['Shaurya Malik', 'Tanya Mathur', 'Arjun Saxena'],
    isActive: true
  },
  {
    id: 'sch_st_xaviers_kol',
    name: "St. Xavier's Collegiate School",
    teamName: 'Calcutta Circuitry',
    teamNumber: 'BRL-26-07',
    city: 'Kolkata, WB',
    students: ['Sourav Banerjee', 'Ritwik Ghosh', 'Anirban Das'],
    isActive: true
  },
  {
    id: 'sch_doon_school',
    name: 'The Doon School',
    teamName: 'Apex Chandbagh',
    teamNumber: 'BRL-26-08',
    city: 'Dehradun, UK',
    students: ['Yuvraj Chauhan', 'Devansh Singhal', 'Samarjit Roy'],
    isActive: true
  },
  {
    id: 'sch_hps_begumpet',
    name: 'Hyderabad Public School, Begumpet',
    teamName: 'Deccan Drones & Bots',
    teamNumber: 'BRL-26-09',
    city: 'Hyderabad, TS',
    students: ['Varun Reddy', 'Sneha Chary', 'Karthik Raju'],
    isActive: true
  },
  {
    id: 'sch_dav_chennai',
    name: 'DAV Boys Senior Secondary School',
    teamName: 'Madras Mechatrons',
    teamNumber: 'BRL-26-10',
    city: 'Chennai, TN',
    students: ['Sanjay Raman', 'Abhishek Sundar', 'Harish Balaji'],
    isActive: true
  }
];

export const INITIAL_PRESET_MATCHES = [
  {
    id: 'match_1',
    matchNumber: 1,
    teamAId: 'sch_delhi_public',
    teamBId: 'sch_mothers_int',
    result: 'pending' as const,
    teamAPoints: 0,
    teamBPoints: 0,
    status: 'scheduled' as const,
    isDraft: false,
    matchNotes: 'Match 1: Northern Zone Quarter-Final'
  },
  {
    id: 'match_2',
    matchNumber: 2,
    teamAId: 'sch_bombay_scottish',
    teamBId: 'sch_kv_iit_powai',
    result: 'pending' as const,
    teamAPoints: 0,
    teamBPoints: 0,
    status: 'scheduled' as const,
    isDraft: false,
    matchNotes: 'Match 2: Western Zone Face-off'
  },
  {
    id: 'match_3',
    matchNumber: 3,
    teamAId: 'sch_nps_blr',
    teamBId: 'sch_dav_chennai',
    result: 'pending' as const,
    teamAPoints: 0,
    teamBPoints: 0,
    status: 'scheduled' as const,
    isDraft: false,
    matchNotes: 'Match 3: Southern Derby'
  },
  {
    id: 'match_4',
    matchNumber: 4,
    teamAId: 'sch_modern_school',
    teamBId: 'sch_st_xaviers_kol',
    result: 'pending' as const,
    teamAPoints: 0,
    teamBPoints: 0,
    status: 'scheduled' as const,
    isDraft: false,
    matchNotes: 'Match 4: Inter-city Arena Clash'
  }
];
