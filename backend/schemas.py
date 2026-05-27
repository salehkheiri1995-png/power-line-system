from pydantic import BaseModel, ConfigDict
from typing import Optional

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