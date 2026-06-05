from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date


class RecordBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: Optional[str] = None
    line_name: Optional[str] = None
    voltage_level: Optional[str] = None
    program_type: Optional[str] = None
    work_description: Optional[str] = None
    tower_number: Optional[str] = None
    location: Optional[str] = None
    pm_date: Optional[str] = None
    execution_date: Optional[str] = None
    team_count: Optional[float] = None
    personnel_count: Optional[float] = None
    supervisor: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    tower_number2: Optional[str] = None
    title_of_work: Optional[str] = None
    extra_tower_number: Optional[str] = None


class RecordCreate(RecordBase):
    pass


class RecordUpdate(RecordBase):
    pass


class Record(RecordBase):
    id: int


# Schema for filter options
class FilterOptions(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    program_types: list[str]
    codes: list[str]
    voltage_levels: list[str]
    locations: list[str]
    supervisors: list[str]
    line_names: list[str]
    work_descriptions: list[str]


# ======================== Line Schemas ========================
class LineBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    voltage: int = 0
    status: str = "active"
    color_class: str = "c1"
    color_hex: str = "#3b82f6"

    line_code: Optional[str] = None
    line_name: Optional[str] = None
    voltage_level: Optional[int] = None
    current_type: Optional[str] = None
    total_length_km: Optional[float] = None
    line_type: Optional[str] = None
    number_of_circuits: Optional[int] = None
    source_substation: Optional[str] = None
    destination_substation: Optional[str] = None
    commissioning_date: Optional[date] = None
    line_status: Optional[str] = None
    last_inspection_date: Optional[date] = None
    max_transfer_mw: Optional[int] = None
    rated_current_a: Optional[int] = None
    geo_path: Optional[str] = None


class LineCreate(LineBase):
    pass


class LineUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: Optional[str] = None
    voltage: Optional[int] = None
    status: Optional[str] = None
    color_class: Optional[str] = None
    color_hex: Optional[str] = None
    line_code: Optional[str] = None
    line_name: Optional[str] = None
    voltage_level: Optional[int] = None
    current_type: Optional[str] = None
    total_length_km: Optional[float] = None
    line_type: Optional[str] = None
    number_of_circuits: Optional[int] = None
    source_substation: Optional[str] = None
    destination_substation: Optional[str] = None
    commissioning_date: Optional[date] = None
    line_status: Optional[str] = None
    last_inspection_date: Optional[date] = None
    max_transfer_mw: Optional[int] = None
    rated_current_a: Optional[int] = None
    geo_path: Optional[str] = None


class Line(LineBase):
    pass


# ======================== Tower Schemas ========================
class TowerBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    line_id: str
    number: int
    x: float = 0
    y: float = 0
    type: str = "معلق"
    height: float = 40

    tower_code: Optional[str] = None
    tower_type: Optional[str] = None
    material: Optional[str] = None
    height_meters: Optional[float] = None
    arm_width_meters: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    altitude_meters: Optional[float] = None
    foundation_type: Optional[str] = None
    foundation_depth_meters: Optional[float] = None
    foundation_date: Optional[date] = None
    anti_climbing_device: Optional[bool] = None
    warning_sign: Optional[bool] = None
    bird_nest_status: Optional[str] = None
    last_inspection_date: Optional[date] = None
    inspection_report: Optional[str] = None
    photos: Optional[str] = None
    grounding_resistance_ohm: Optional[float] = None
    grounding_rod_count: Optional[int] = None
    last_grounding_test_date: Optional[date] = None

    last_maintenance: Optional[str] = None
    next_maintenance: Optional[str] = None


class TowerCreate(TowerBase):
    pass


class TowerUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    number: Optional[int] = None
    x: Optional[float] = None
    y: Optional[float] = None
    type: Optional[str] = None
    height: Optional[float] = None
    tower_code: Optional[str] = None
    tower_type: Optional[str] = None
    material: Optional[str] = None
    height_meters: Optional[float] = None
    arm_width_meters: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    altitude_meters: Optional[float] = None
    foundation_type: Optional[str] = None
    foundation_depth_meters: Optional[float] = None
    foundation_date: Optional[date] = None
    anti_climbing_device: Optional[bool] = None
    warning_sign: Optional[bool] = None
    bird_nest_status: Optional[str] = None
    last_inspection_date: Optional[date] = None
    inspection_report: Optional[str] = None
    photos: Optional[str] = None
    grounding_resistance_ohm: Optional[float] = None
    grounding_rod_count: Optional[int] = None
    last_grounding_test_date: Optional[date] = None


class Tower(TowerBase):
    pass


# ======================== Insulator Schemas ========================
class InsulatorBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tower_id: str
    phase_position: Optional[str] = None
    insulator_type: Optional[str] = None
    material: Optional[str] = None
    number_of_discs: Optional[int] = None
    mechanical_class_kn: Optional[int] = None
    condition: Optional[str] = None
    installation_date: Optional[date] = None


class InsulatorCreate(InsulatorBase):
    pass


class InsulatorUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    phase_position: Optional[str] = None
    insulator_type: Optional[str] = None
    material: Optional[str] = None
    number_of_discs: Optional[int] = None
    mechanical_class_kn: Optional[int] = None
    condition: Optional[str] = None
    installation_date: Optional[date] = None


class Insulator(InsulatorBase):
    id: int


# ======================== Conductor Schemas ========================
class ConductorBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tower_id: str
    phase_number: Optional[int] = None
    conductor_type: Optional[str] = None
    cross_section_mm2: Optional[int] = None
    strand_count: Optional[int] = None
    tension_kgf: Optional[float] = None
    sag_mm: Optional[float] = None
    clamp_type: Optional[str] = None


class ConductorCreate(ConductorBase):
    pass


class ConductorUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    phase_number: Optional[int] = None
    conductor_type: Optional[str] = None
    cross_section_mm2: Optional[int] = None
    strand_count: Optional[int] = None
    tension_kgf: Optional[float] = None
    sag_mm: Optional[float] = None
    clamp_type: Optional[str] = None


class Conductor(ConductorBase):
    id: int


# ======================== HardwareFitting Schemas ========================
class HardwareFittingBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tower_id: str
    fitting_type: Optional[str] = None
    subtype: Optional[str] = None
    quantity: Optional[int] = None
    installation_date: Optional[date] = None
    condition: Optional[str] = None


class HardwareFittingCreate(HardwareFittingBase):
    pass


class HardwareFittingUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    fitting_type: Optional[str] = None
    subtype: Optional[str] = None
    quantity: Optional[int] = None
    installation_date: Optional[date] = None
    condition: Optional[str] = None


class HardwareFitting(HardwareFittingBase):
    id: int


# ======================== TowerGrounding Schemas ========================
class TowerGroundingBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tower_id: str
    resistance_ohm: Optional[float] = None
    electrode_type: Optional[str] = None
    number_of_electrodes: Optional[int] = None
    test_date: Optional[date] = None
    next_test_due_date: Optional[date] = None


class TowerGroundingCreate(TowerGroundingBase):
    pass


class TowerGroundingUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    resistance_ohm: Optional[float] = None
    electrode_type: Optional[str] = None
    number_of_electrodes: Optional[int] = None
    test_date: Optional[date] = None
    next_test_due_date: Optional[date] = None


class TowerGrounding(TowerGroundingBase):
    id: int


# ======================== Span Schemas ========================
class SpanBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    line_id: str
    from_tower_id: str
    to_tower_id: str
    span_length_meters: Optional[float] = None
    terrain_type: Optional[str] = None
    min_ground_clearance_meters: Optional[float] = None
    mid_span_damper_count: Optional[int] = None


class SpanCreate(SpanBase):
    pass


class SpanUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    span_length_meters: Optional[float] = None
    terrain_type: Optional[str] = None
    min_ground_clearance_meters: Optional[float] = None
    mid_span_damper_count: Optional[int] = None


class Span(SpanBase):
    id: int


# ======================== Inspection Schemas ========================
class InspectionBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tower_id: Optional[str] = None
    line_id: Optional[str] = None
    inspection_date: Optional[date] = None
    inspection_type: Optional[str] = None
    inspector_name: Optional[str] = None
    defects_found: Optional[str] = None
    action_taken: Optional[str] = None
    next_inspection_date: Optional[date] = None


class InspectionCreate(InspectionBase):
    pass


class InspectionUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tower_id: Optional[str] = None
    line_id: Optional[str] = None
    inspection_date: Optional[date] = None
    inspection_type: Optional[str] = None
    inspector_name: Optional[str] = None
    defects_found: Optional[str] = None
    action_taken: Optional[str] = None
    next_inspection_date: Optional[date] = None


class Inspection(InspectionBase):
    id: int
