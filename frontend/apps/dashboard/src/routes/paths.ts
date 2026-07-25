/** Central route path constants shared by the sidebar, topbar, and routing. */
export const paths = {
  home: "/",

  // shelterEmployee
  myShelter: "/shelter",
  shelterEmployees: "/shelter/employees",
  animals: "/animals",
  adoptionRequests: "/adoption-requests",

  // vet
  vetProfile: "/vet-profile",
  appointments: "/appointments",

  // shared (shelterEmployee + vet)
  reviews: "/reviews",

  // superadmin
  shelters: "/shelters",
  users: "/users",
  applications: "/applications",
  animalShelterDetail: (shelterId: string) => `/animals/shelters/${shelterId}`,
  adopters: "/adopters",

  // superadmin (list) + shelterEmployee (single-adopter lookup from adoption requests)
  adopterDetail: (userId: string) => `/adopters/${userId}`,

  // any authenticated dashboard role
  notifications: "/notifications",
  account: "/account",

  // auth
  login: "/login",
  unauthorized: "/unauthorized",
} as const;
