## Actors

Superadmin, Shelter Employee, Vet, Adopter

## Features

# User managment : Mustafa

# Animals managment : Mustafa

# Shelter managment: arwa

# Search by location : zain

# Appointment managment: ali

# Adoption Request: amira

# Reviews (Bonus Feature)


## Collection

# User {

firstName: String,
lastName: String,
dateOfBirth: Date,

gender: {
type: String,
enum: ["male", "female"]
},

email: String,
password: String,
phone: String,

role: {
type: String,
enum: ["superadmin", "shelterEmployee", "vet", "adopter"]
},

shelterEmployeeProfile: {
shelterId: ObjectId, // ref: Shelter
},

vetProfile: {
specialization: String,
bio: String,
experienceYears: Number,
availableDays: [String],
consultationTypes: {
type: [String],
enum: ["vetConsultation", "behaviorTraining"]
}
},

profileImage: String,
address: String,

isActive: Boolean,

createdAt: Date,
updatedAt: Date
}

# AdopterProfile {

userId: ObjectId, // ref: User

homeType: {
type: String,
enum: ["apartment", "house", "farm"]
},

hasKids: Boolean,

hasOtherPets: Boolean,

experienceLevel: {
type: String,
enum: ["beginner", "intermediate", "expert"]
},

dailyActivityLevel: {
type: String,
enum: ["low", "medium", "high"]
},

isAllergic : Boolean

ownerType: {
type: String,
enum: ["single", "family"]
},

preferredSpecies: {
type: String,
enum: ["dog", "cat", "bird", "rabbit", "fish", "any"]
}
}

# Animal {

name: String,
age: Number,

ageUnit: {
type: String,
enum: ["months", "years"]
},

species: {
type: String,
enum: ["dog", "cat", "bird", "rabbit", "fish", "other"]
},

breed: String,

gender: {
type: String,
enum: ["male", "female"]
},

size: {
type: String,
enum: ["small", "medium", "large"]
},

color: String,

healthStatus: {
type: String,
enum: ["healthy", "needsCare", "specialNeeds", "underTreatment"]
},

vaccinated: Boolean,
description: String,
images: [String],

adoptionStatus: {
type: String,
enum: ["available", "pending", "adopted", "unavailable"],
default: "available"
},

shelterId: ObjectId, // ref: Name Shelter AND location of shelter
addedBy: ObjectId, // ref: User

requirements: {
homeType: {
type: String,
enum: ["apartment", "house", "farm", "any"]
},

    suitableForKids: Boolean,

    goodWithOtherPets: {
      type: Boolean,
      default: false
    },

    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "expert", "any"]
    },

    dailyActivityLevel: {
      type: String,
      enum: ["low", "medium", "high"]
    },

    ownerType: {
      type: String,
      enum: ["single", "family", "any"]
    }

isAllergic : Boolean
},

isActive: {
type: Boolean,
},

createdAt: Date,
updatedAt: Date
}

# Shelter {

name: String,
email: String,
phone: String,
logo: String,
images: objectId // ref Animal
Shelter image : [string]
description: String,

address: String,
city: String,
latitude: Number,
longitude: Number,
employees: [ObjectId]  // ref: users

location: {
type: { type: String,
enum: ["Point"], },
coordinates: [Number] // [longitude, latitude]
},

supportedSpecies: [{
type: String,
enum: ["dog", "cat", "bird", "rabbit", "fish", "other"]
}],

capacity: Number,

isVerified: {
type: Boolean,
},

isActive: {
type: Boolean,
},

operatingHours: {
open: String,
},

  <!-- donationInfo: {
    bankAccount: String,
    paypalEmail: String
  }, -->

socialLinks: {
facebook: String,
instagram: String,
website: String
},

createdBy: ObjectId // ref: users

createdAt: Date,
updatedAt: Date
}

# AdoptionRequest {

adopterId: {
type: ObjectId,
ref: "User"
},

animalId: {
type: ObjectId,
ref: "Animal"
},

shelterId: {
type: ObjectId,
ref: "Shelter"
},

status: {
  type: String,
  enum: [
    "pending",
    "interview",
    "homeCheck",
    "approved",
    "rejected"
  ]
}

InterviewDate: Date

InterviewNotes: String

notes: String,

rejectionReason: String,

ReviewedBy: {
type: ObjectId,
ref: "User"
},

createdAt: Date,
updatedAt: Date
}

# AppointmentManagment {

adopterId: {
type: ObjectId,
ref: "User"
},

vetId: {
type: ObjectId,
ref: "User"
},

animalId: {
type: ObjectId,
ref: "Animal"
},

appointmentType: {
type: String,
enum: ["vetConsultation", "behaviorTraining"]
},

<!-- startTime: {   with Moaness
type: Date,
required: true
},

endTime: {    with Moaness
type: Date,
required: true
}, -->

appointmentDate: Date,

status: {
type: String,
enum: [
"pending",
"confirmed",
"completed",
"cancelled"
],
},

notes: String,

createdAt: Date,
updatedAt: Date
}

# Review {
  userId: {
    type: ObjectId,
    ref: "User"
  },

  shelterId: {
    type: ObjectId,
    ref: "Shelter"
  },

  adoptionRequestId: {
    type: ObjectId,
    ref: "AdoptionRequest",
    unique: true
  },

  rating: {
    type: Number,
    min: 1,
    max: 5
  },

  comment: String,

  createdAt: Date,
  updatedAt: Date
}

# Realationships

- User (1) ----------------> (1) AdopterProfile
- Shelter (1) ------------> (M) User (Shelter Employee)
- Shelter (1) ------------> (M) Animal
- User (Shelter Employee) (1) ---------------> (M) Animal
- User (1) ---------------> (M) AdoptionRequest
- Animal (1) -------------> (M) AdoptionRequest
- Shelter (1) ------------> (M) AdoptionRequest
- User (1) ---------------> (M) AdoptionRequest
- User (Adopter) (1) -----> (M) Appointment
- User (Vet) (1) ---------> (M) Appointment
- Animal (1) -------------> (M) Appointment
- User (1) -----------------> (M) Review
- Shelter (1) --------------> (M) Review
- AdoptionRequest (1) ------> (1) Review

# ALL RELATIONSHIPS (1:1 & 1:M) THERE IS NO (M:M)

## RULES

1. Super Admin

- Manage all users.
- Manage all shelters.
- Verify shelters.
- View all animals.
- View all adoption requests.
- View all appointments.
- Activate / deactivate users, shelters, and animals.

2. Shelter Employee

- Manage animals only for their shelter.
- Add new animals to their shelter.
- Update animal information.
- Review adoption requests for their shelter.
- Update adoption request stages:
  pendingReview → interview → homeCheck → approved / rejected

3. Vet

- Manage own appointments.
- View appointment details.
- Confirm or cancel appointments.
- Complete consultations.
- Add consultation notes.

4. Adopter

- Register and login.
- Update profile.
- Fill adopter profile / matching questions.
- Search nearby shelters.
- View animal details.
- Submit adoption request.
- Book appointments.
- View own adoption requests and appointments.