export type ProjectStatus =
  | 'Draft'
  | 'In Engineering'
  | 'Ready for Estimate'
  | 'Sent to Customer'
  | 'Finalized';

export interface MockProject {
  id: string;
  code: string;
  name: string;
  client: string;
  clientDomain: string;
  avatarColor: string;
  status: ProjectStatus;
  configDone: number;
  configTotal: number;
  engineerName: string | null;
  engineerEmail: string | null;
  lastActivity: string;
  address: string;
  cityState: string;
  zip: string;
  projectType: string;
  poolType: string;
  dimensions: string;
  estimatedCost: string;
  lifecycleIndex: number;
  team: { role: string; name: string; avatar: string }[];
  created: string;
  modified: string;
  deadline: string;
}

export const STATUS_META: Record<ProjectStatus, { color: string; label: string }> = {
  Draft: { color: '#9ca3af', label: 'Draft' },
  'In Engineering': { color: '#3b82f6', label: 'In Progress' },
  'Ready for Estimate': { color: '#f59e0b', label: 'Estimate Ready' },
  'Sent to Customer': { color: '#8b5cf6', label: 'Sent' },
  Finalized: { color: '#22c55e', label: 'Finalized' },
};

export const MOCK_PROJECTS: MockProject[] = [
  {
    id: 'smith-residence-pool',
    code: 'GPL-13',
    name: 'Smith Residence Pool',
    client: 'AquaBuild Co.',
    clientDomain: 'aquabuild.com',
    avatarColor: '#3b82f6',
    status: 'In Engineering',
    configDone: 9,
    configTotal: 13,
    engineerName: 'Jordan Lee, PE',
    engineerEmail: 'jordan.lee@example.com',
    lastActivity: 'Just now',
    address: '742 Evergreen Terrace',
    cityState: 'Springfield, IL',
    zip: '62704',
    projectType: 'Residential',
    poolType: 'Skimmer, Plaster',
    dimensions: '480 sq ft · 18,200 gal',
    estimatedCost: '$142,800',
    lifecycleIndex: 1,
    team: [
      { role: 'Client contact', name: 'M. Smith', avatar: 'MS' },
      { role: 'Sales', name: 'Alex Rivera', avatar: 'AR' },
      { role: 'Project Mgr', name: 'Casey Nguyen', avatar: 'CN' },
    ],
    created: 'Jan 12, 2025',
    modified: 'Mar 27, 2025',
    deadline: '5 days',
  },
  {
    id: 'johnson-commercial-spa',
    code: 'GPL-14',
    name: 'Johnson Commercial Spa',
    client: 'Johnson Hospitality Group',
    clientDomain: 'johnsonhg.com',
    avatarColor: '#8b5cf6',
    status: 'Draft',
    configDone: 3,
    configTotal: 13,
    engineerName: null,
    engineerEmail: null,
    lastActivity: 'Yesterday',
    address: '1200 Marina Blvd',
    cityState: 'San Diego, CA',
    zip: '92101',
    projectType: 'Commercial',
    poolType: 'Overflow edge',
    dimensions: '220 sq ft · 6,400 gal',
    estimatedCost: '$89,200',
    lifecycleIndex: 0,
    team: [{ role: 'Client contact', name: 'Pat Johnson', avatar: 'PJ' }],
    created: 'Mar 20, 2025',
    modified: 'Mar 24, 2025',
    deadline: '12 days',
  },
  {
    id: 'riverside-estate',
    code: 'GPL-15',
    name: 'Riverside Estate',
    client: 'AquaBuild Co.',
    clientDomain: 'aquabuild.com',
    avatarColor: '#0891b2',
    status: 'Ready for Estimate',
    configDone: 13,
    configTotal: 13,
    engineerName: 'Jordan Lee, PE',
    engineerEmail: 'jordan.lee@example.com',
    lastActivity: '4 days ago',
    address: '88 River Road',
    cityState: 'Austin, TX',
    zip: '78704',
    projectType: 'Residential',
    poolType: 'Vanishing edge',
    dimensions: '620 sq ft · 24,100 gal',
    estimatedCost: '$198,400',
    lifecycleIndex: 2,
    team: [
      { role: 'Client contact', name: 'R. Chen', avatar: 'RC' },
      { role: 'Sales', name: 'Alex Rivera', avatar: 'AR' },
    ],
    created: 'Nov 3, 2024',
    modified: 'Mar 21, 2025',
    deadline: '2 days',
  },
  {
    id: 'oak-hills-club',
    code: 'GPL-16',
    name: 'Oak Hills Club Renovation',
    client: 'Oak Hills Golf & Country Club',
    clientDomain: 'oakhillsgcc.com',
    avatarColor: '#ea580c',
    status: 'Sent to Customer',
    configDone: 13,
    configTotal: 13,
    engineerName: 'Sam Okonkwo, PE',
    engineerEmail: 's.okonkwo@example.com',
    lastActivity: '1 week ago',
    address: '1 Clubhouse Dr',
    cityState: 'Scottsdale, AZ',
    zip: '85255',
    projectType: 'Commercial',
    poolType: 'Competition, tile',
    dimensions: '1,200 sq ft · 45,000 gal',
    estimatedCost: '$412,000',
    lifecycleIndex: 3,
    team: [{ role: 'Client contact', name: 'D. Morrison', avatar: 'DM' }],
    created: 'Aug 1, 2024',
    modified: 'Mar 15, 2025',
    deadline: '—',
  },
  {
    id: 'meyer-backyard',
    code: 'GPL-17',
    name: 'Meyer Backyard Plunge',
    client: 'Independent Homeowner',
    clientDomain: '—',
    avatarColor: '#e11d48',
    status: 'Finalized',
    configDone: 13,
    configTotal: 13,
    engineerName: 'Jordan Lee, PE',
    engineerEmail: 'jordan.lee@example.com',
    lastActivity: '3 weeks ago',
    address: '45 Birch Ln',
    cityState: 'Denver, CO',
    zip: '80206',
    projectType: 'Residential',
    poolType: 'Plunge, gunite',
    dimensions: '96 sq ft · 2,800 gal',
    estimatedCost: '$38,900',
    lifecycleIndex: 4,
    team: [{ role: 'Client contact', name: 'T. Meyer', avatar: 'TM' }],
    created: 'Sep 18, 2024',
    modified: 'Feb 28, 2025',
    deadline: '—',
  },
  {
    id: 'sunrise-wellness',
    code: 'GPL-18',
    name: 'Sunrise Wellness Center',
    client: 'Sunrise Health Partners',
    clientDomain: 'sunrisehealth.com',
    avatarColor: '#16a34a',
    status: 'In Engineering',
    configDone: 6,
    configTotal: 13,
    engineerName: 'Sam Okonkwo, PE',
    engineerEmail: 's.okonkwo@example.com',
    lastActivity: '5 hours ago',
    address: '900 Wellness Way',
    cityState: 'Naples, FL',
    zip: '34102',
    projectType: 'Commercial',
    poolType: 'Lap + spa combo',
    dimensions: '340 sq ft · 11,500 gal',
    estimatedCost: '$156,000',
    lifecycleIndex: 1,
    team: [
      { role: 'Client contact', name: 'L. Patel', avatar: 'LP' },
      { role: 'Sales', name: 'Alex Rivera', avatar: 'AR' },
      { role: 'PM', name: 'Sam Okonkwo', avatar: 'SO' },
      { role: 'QA', name: 'Kim Lee', avatar: 'KL' },
    ],
    created: 'Feb 2, 2025',
    modified: 'Mar 26, 2025',
    deadline: '8 days',
  },
];

export function getProjectById(id: string): MockProject | undefined {
  return MOCK_PROJECTS.find((p) => p.id === id);
}
