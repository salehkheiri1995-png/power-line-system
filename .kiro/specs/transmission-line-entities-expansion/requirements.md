# Requirements Document

## Introduction

این سند الزامات توسعه سیستم مدیریت خطوط انتقال برق را برای افزودن 8 موجودیت جدید مشخص می‌کند. این موجودیت‌ها شامل Line (خط انتقال)، Tower (دکل)، Insulator (مقره)، Conductor (هادی)، HardwareFitting (یراق‌آلات)، TowerGrounding (سیستم ارت)، Span (دهانه)، و Inspection (بازرسی) هستند. این موجودیت‌ها به همراه روابط و قیدهای مشخص شده، امکان مدیریت جامع خطوط انتقال برق را فراهم می‌آورند.

## Glossary

- **System**: سیستم مدیریت خطوط انتقال برق (Power Transmission Line Management System)
- **Line**: خط انتقال برق که از دکل‌های متعدد تشکیل شده است
- **Tower**: دکل که سازه فیزیکی نگهدارنده هادی‌های برق است
- **Insulator**: مقره که از عایق الکتریکی بین هادی و دکل استفاده می‌شود
- **Conductor**: هادی که سیم انتقال جریان برق است
- **HardwareFitting**: یراق‌آلات که قطعات فلزی اتصال دهنده در دکل است
- **TowerGrounding**: سیستم ارت دکل که برای حفاظت الکتریکی است
- **Span**: دهانه که فاصله بین دو دکل متوالی است
- **Inspection**: بازرسی که فرآیند بررسی وضعیت خطوط یا دکل‌ها است
- **VoltageLevel**: سطح ولتاژ که مقدار ولتاژ عملیاتی خط است (به کیلوولت)
- **LineCode**: کد خط که شناسه یکتا برای هر خط انتقال است
- **TowerNumber**: شماره دکل که شماره یکتای دکل در یک خط است
- **Database**: پایگاه داده SQLite که اطلاعات را ذخیره می‌کند
- **API**: رابط برنامه‌نویسی FastAPI که عملیات CRUD را فراهم می‌کند
- **User**: کاربر که شخص استفاده‌کننده از سیستم است

## Requirements

### Requirement 1: Line Entity Management

**User Story:** As a system administrator, I want to manage transmission line entities with complete information, so that I can track all lines in the regional power network

#### Acceptance Criteria

1. THE System SHALL create a Line entity with fields: LineCode (String), LineName (String), VoltageLevel (Integer), CurrentType (String), Length (Float), StartPoint (String), EndPoint (String), CommissionDate (String), OperationalStatus (String), Owner (String), Region (String), GeoPath (JSON), Documents (JSON), Latitude (Float), Longitude (Float), CreatedAt (DateTime), UpdatedAt (DateTime)
2. WHEN a new Line is created, THE System SHALL validate that VoltageLevel is one of 132, 230, 400, or 765
3. WHEN a new Line is created, THE System SHALL ensure LineCode is unique across all lines
4. WHEN a Line is updated, THE System SHALL automatically update the UpdatedAt timestamp
5. THE System SHALL allow retrieval of all Lines with filtering by VoltageLevel, Region, and OperationalStatus
6. THE System SHALL allow deletion of a Line only if it has no associated Towers
7. WHEN CurrentType is provided, THE System SHALL validate it is either "AC" or "DC"

### Requirement 2: Tower Entity Management

**User Story:** As a field engineer, I want to manage tower entities with detailed specifications, so that I can maintain accurate records of all towers on transmission lines

#### Acceptance Criteria

1. THE System SHALL create a Tower entity with fields: TowerId (String), LineCode (ForeignKey), TowerNumber (Integer), TowerType (String), Material (String), Height (Float), Foundation (String), ConstructionDate (String), Condition (String), Latitude (Float), Longitude (Float), Altitude (Float), TerrainType (String), AccessRoad (Boolean), Photos (JSON), Documents (JSON), Notes (Text), LastInspection (String), NextInspection (String), Status (String), Manufacturer (String), SerialNumber (String), CreatedAt (DateTime), UpdatedAt (DateTime)
2. WHEN a new Tower is created, THE System SHALL validate that the combination of LineCode and TowerNumber is unique
3. WHEN a Tower is associated with a Line, THE System SHALL validate that the LineCode exists in the Line entity
4. THE System SHALL allow retrieval of all Towers for a specific Line ordered by TowerNumber
5. WHEN Latitude and Longitude are provided, THE System SHALL validate they are within valid geographic coordinate ranges
6. WHEN Height is provided, THE System SHALL validate it is a positive number
7. THE System SHALL allow filtering Towers by TowerType, Material, Condition, and Status

### Requirement 3: Insulator Entity Management

**User Story:** As a maintenance technician, I want to record insulator details for each tower, so that I can track insulator conditions and plan replacements

#### Acceptance Criteria

1. THE System SHALL create an Insulator entity with fields: InsulatorId (String), TowerId (ForeignKey), PhasePosition (String), InsulatorType (String), Material (String), Quantity (Integer), Condition (String), InstallationDate (String), CreatedAt (DateTime), UpdatedAt (DateTime)
2. WHEN a new Insulator is created, THE System SHALL validate that TowerId exists in the Tower entity
3. WHEN PhasePosition is provided, THE System SHALL validate it is one of "Phase_A", "Phase_B", "Phase_C", or "Ground"
4. WHEN Quantity is provided, THE System SHALL validate it is a positive integer
5. THE System SHALL allow retrieval of all Insulators for a specific Tower grouped by PhasePosition
6. WHEN Condition is provided, THE System SHALL validate it is one of "Good", "Fair", "Poor", or "Critical"
7. THE System SHALL allow deletion of an Insulator without restrictions

### Requirement 4: Conductor Entity Management

**User Story:** As an electrical engineer, I want to manage conductor information for each tower, so that I can monitor conductor specifications and performance

#### Acceptance Criteria

1. THE System SHALL create a Conductor entity with fields: ConductorId (String), TowerId (ForeignKey), PhaseNumber (String), ConductorType (String), CrossSection (Float), Tension (Float), Sag (Float), InstallationDate (String), CreatedAt (DateTime), UpdatedAt (DateTime)
2. WHEN a new Conductor is created, THE System SHALL validate that TowerId exists in the Tower entity
3. WHEN PhaseNumber is provided, THE System SHALL validate it is one of "Phase_1", "Phase_2", "Phase_3", or "Ground_Wire"
4. WHEN CrossSection is provided, THE System SHALL validate it is a positive number
5. WHEN Tension is provided, THE System SHALL validate it is a positive number
6. WHEN Sag is provided, THE System SHALL validate it is a non-negative number
7. THE System SHALL allow retrieval of all Conductors for a specific Tower ordered by PhaseNumber

### Requirement 5: Hardware Fitting Entity Management

**User Story:** As a maintenance planner, I want to track hardware fittings on each tower, so that I can manage inventory and replacement schedules

#### Acceptance Criteria

1. THE System SHALL create a HardwareFitting entity with fields: FittingId (String), TowerId (ForeignKey), FittingType (String), Quantity (Integer), Material (String), Condition (String), CreatedAt (DateTime), UpdatedAt (DateTime)
2. WHEN a new HardwareFitting is created, THE System SHALL validate that TowerId exists in the Tower entity
3. WHEN FittingType is provided, THE System SHALL validate it is one of "Clamp", "Shackle", "Damper", "Spacer", "Connector", or "Other"
4. WHEN Quantity is provided, THE System SHALL validate it is a positive integer
5. THE System SHALL allow retrieval of all HardwareFittings for a specific Tower
6. WHEN Condition is provided, THE System SHALL validate it is one of "Good", "Fair", "Poor", or "Critical"
7. THE System SHALL allow bulk creation of multiple HardwareFittings for a single Tower

### Requirement 6: Tower Grounding Entity Management

**User Story:** As a safety officer, I want to maintain grounding system records for each tower, so that I can ensure electrical safety compliance

#### Acceptance Criteria

1. THE System SHALL create a TowerGrounding entity with fields: GroundingId (String), TowerId (ForeignKey), GroundingType (String), Resistance (Float), MeasurementDate (String), Condition (String), CreatedAt (DateTime), UpdatedAt (DateTime)
2. WHEN a new TowerGrounding is created, THE System SHALL validate that TowerId exists in the Tower entity
3. WHEN a new TowerGrounding is created, THE System SHALL ensure that each TowerId has at most one TowerGrounding record
4. WHEN Resistance is provided, THE System SHALL validate it is a positive number
5. WHEN Resistance exceeds 5 ohms, THE System SHALL flag the TowerGrounding as requiring attention
6. WHEN GroundingType is provided, THE System SHALL validate it is one of "Rod", "Grid", "Plate", or "Chemical"
7. THE System SHALL allow retrieval of TowerGrounding by TowerId with a one-to-one relationship

### Requirement 7: Span Entity Management

**User Story:** As a line designer, I want to define spans between consecutive towers, so that I can analyze line geometry and terrain characteristics

#### Acceptance Criteria

1. THE System SHALL create a Span entity with fields: SpanId (String), LineCode (ForeignKey), FromTowerId (ForeignKey), ToTowerId (ForeignKey), Distance (Float), TerrainType (String), CreatedAt (DateTime), UpdatedAt (DateTime)
2. WHEN a new Span is created, THE System SHALL validate that LineCode exists in the Line entity
3. WHEN a new Span is created, THE System SHALL validate that both FromTowerId and ToTowerId exist in the Tower entity
4. WHEN a new Span is created, THE System SHALL validate that FromTowerId and ToTowerId belong to the same LineCode
5. WHEN Distance is provided, THE System SHALL validate it is a positive number
6. WHEN TerrainType is provided, THE System SHALL validate it is one of "Flat", "Rolling", "Hilly", "Mountainous", "River_Crossing", or "Urban"
7. THE System SHALL allow retrieval of all Spans for a specific Line ordered by FromTowerId

### Requirement 8: Inspection Entity Management

**User Story:** As an inspection manager, I want to record inspections for lines or towers, so that I can maintain inspection history and schedule future inspections

#### Acceptance Criteria

1. THE System SHALL create an Inspection entity with fields: InspectionId (String), TargetType (String), TargetId (String), InspectionDate (String), Inspector (String), InspectionType (String), Findings (Text), Severity (String), ActionRequired (String), Status (String), CreatedAt (DateTime), UpdatedAt (DateTime)
2. WHEN a new Inspection is created, THE System SHALL validate that TargetType is either "Line" or "Tower"
3. WHEN TargetType is "Line", THE System SHALL validate that TargetId exists in the Line entity
4. WHEN TargetType is "Tower", THE System SHALL validate that TargetId exists in the Tower entity
5. WHEN Severity is provided, THE System SHALL validate it is one of "Low", "Medium", "High", or "Critical"
6. WHEN InspectionType is provided, THE System SHALL validate it is one of "Routine", "Emergency", "Post_Storm", or "Annual"
7. THE System SHALL allow retrieval of all Inspections for a specific Line or Tower filtered by InspectionDate

### Requirement 9: Inspection Timeliness Validation

**User Story:** As a compliance officer, I want to ensure inspections are performed within required timeframes, so that regulatory requirements are met

#### Acceptance Criteria

1. WHEN retrieving a Line, THE System SHALL calculate the time elapsed since the last Inspection
2. WHEN the last Inspection for a Line is older than 2 years, THE System SHALL flag the Line as requiring inspection
3. WHEN retrieving a Tower, THE System SHALL calculate the time elapsed since the last Inspection
4. WHEN the last Inspection for a Tower is older than 2 years, THE System SHALL flag the Tower as requiring inspection
5. THE System SHALL provide a report of all Lines and Towers that require inspection based on the 2-year rule
6. WHEN an Inspection is created for a Line or Tower, THE System SHALL update the last inspection timestamp for that entity
7. THE System SHALL allow filtering entities by inspection status (Current, Due, Overdue)

### Requirement 10: Entity Relationship Integrity

**User Story:** As a database administrator, I want to maintain referential integrity across all entities, so that data consistency is guaranteed

#### Acceptance Criteria

1. WHEN a Line is deleted, THE System SHALL prevent deletion if associated Towers exist
2. WHEN a Tower is deleted, THE System SHALL cascade delete all associated Insulators, Conductors, HardwareFittings, TowerGrounding, and Spans
3. WHEN a Tower is deleted, THE System SHALL update all Inspections with TargetType "Tower" and matching TargetId to mark them as orphaned
4. THE System SHALL maintain foreign key constraints between Line and Tower entities
5. THE System SHALL maintain foreign key constraints between Tower and Insulator, Conductor, HardwareFitting, TowerGrounding entities
6. THE System SHALL maintain foreign key constraints between Line and Span entities
7. THE System SHALL validate all foreign key references before creating or updating records

### Requirement 11: API CRUD Operations

**User Story:** As a frontend developer, I want RESTful API endpoints for all entities, so that I can integrate them with the React frontend

#### Acceptance Criteria

1. THE System SHALL provide POST endpoints to create new records for all 8 entities
2. THE System SHALL provide GET endpoints to retrieve single records by ID for all 8 entities
3. THE System SHALL provide GET endpoints to retrieve lists of records with pagination for all 8 entities
4. THE System SHALL provide PUT endpoints to update existing records for all 8 entities
5. THE System SHALL provide DELETE endpoints to remove records for all 8 entities
6. THE System SHALL return appropriate HTTP status codes (200, 201, 400, 404, 500) for all operations
7. THE System SHALL validate request payloads against defined schemas before processing

### Requirement 12: Data Migration Support

**User Story:** As a system administrator, I want to migrate existing Line and Tower data to the new schema, so that historical data is preserved

#### Acceptance Criteria

1. WHEN the new entities are deployed, THE System SHALL migrate existing Line records to the new Line entity schema
2. WHEN the new entities are deployed, THE System SHALL migrate existing Tower records to the new Tower entity schema
3. WHEN migrating data, THE System SHALL preserve all existing relationships between Lines and Towers
4. WHEN migrating data, THE System SHALL set default values for new fields that have no existing data
5. THE System SHALL generate a migration report showing records migrated and any errors encountered
6. WHEN migration fails for a record, THE System SHALL log the error and continue with remaining records
7. THE System SHALL provide a rollback mechanism to revert to the previous schema if migration fails critically

