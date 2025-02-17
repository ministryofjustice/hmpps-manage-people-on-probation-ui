// eslint-disable-next-line import/no-cycle
import { Name, PersonalCircumstance, PersonSummary } from './common'
import { Validateable } from '../../utils/validationUtils'
import { Note } from './note'

export interface PersonalDetails {
  crn: string
  name: Name
  contacts: PersonalContact[]
  mainAddress?: PersonAddress
  otherAddresses: PersonAddress[]
  preferredGender: string
  dateOfBirth: string
  preferredName?: string
  previousSurname?: string
  aliases: Name[]
  telephoneNumber?: string
  mobileNumber?: string
  email?: string
  circumstances: Circumstances
  disabilities: Disabilities
  provisions: Provisions
  pnc?: string
  sex: string
  religionOrBelief?: string
  sexualOrientation?: string
  documents: Document[]
  addressTypes: AddressType[]
}

export interface PersonalDetailsMainAddress {
  crn: string
  name: Name
  contacts: PersonalContact[]
  mainAddress?: PersonAddress
}
export interface PersonalDetailsUpdateRequest extends Validateable {
  phoneNumber?: string
  mobileNumber?: string
  emailAddress?: string
  buildingName?: string
  buildingNumber?: string
  streetName?: string
  district?: string
  town?: string
  county?: string
  postcode?: string
  addressTypeCode?: string
  startDate?: string
  endDate?: string
  notes?: string
  verified?: string | boolean
  noFixedAddress?: string | boolean
}

export interface PersonalContact {
  name: Name
  relationship?: string
  relationshipType: string
  address?: Address
  contactNotes?: Note[]
  contactNote?: Note
  lastUpdated?: string
  lastUpdatedBy?: Name
}

export interface Address {
  officeName?: string
  buildingName?: string
  buildingNumber?: string
  streetName?: string
  district?: string
  town?: string
  county?: string
  postcode?: string
  ldu?: string
  lastUpdated?: string
  lastUpdatedBy?: Name
}

export interface AddressType {
  code?: string
  description?: string
}

export interface PersonAddress {
  buildingName?: string
  buildingNumber?: string
  streetName?: string
  district?: string
  town?: string
  county?: string
  postcode?: string
  telephoneNumber?: string
  lastUpdated?: string
  lastUpdatedBy?: Name
  from: string
  to: string
  type?: string
  typeCode?: string
  status?: string
  verified?: string | boolean
  noFixedAddress?: string | boolean
  notes?: string
}

export interface Circumstances {
  circumstances: PersonalCircumstance[]
  lastUpdated?: string
}

export interface Disabilities {
  disabilities: string[]
  lastUpdated?: string
}

export interface Provisions {
  provisions: string[]
  lastUpdated?: string
}

export interface Document {
  id: string
  name: string
  lastUpdated?: string
}

export interface ProvisionOverview {
  personSummary: PersonSummary
  provisions: Provision[]
}

export interface Provision {
  description: string
  notes?: string
  lastUpdated: string
  lastUpdatedBy: Name
}

export interface CircumstanceOverview {
  personSummary: PersonSummary
  circumstances: Circumstance[]
}

export interface CircumstancesDetail {
  personSummary: PersonSummary
  circumstances: Circumstances[]
  disabilities: Disability[]
  provisions: Provision[]
}

export interface Circumstance {
  type: string
  subType: string
  notes?: string
  verified: boolean
  startDate: string
  lastUpdated: string
  lastUpdatedBy: Name
}

export interface DisabilityOverview {
  personSummary: PersonSummary
  disabilities?: Disability[]
  disability?: Disability
}

export interface Disability {
  disabilityId: number
  description: string
  disabilityNotes?: Note[]
  disabilityNote?: Note
  lastUpdated: string
  lastUpdatedBy: Name
}
