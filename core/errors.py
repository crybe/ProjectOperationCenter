class BaseError(Exception):
    """Base error class for Nexus Command Hub."""
    def __init__(self, message: str, module: str, severity: str = "info", metadata: dict = None):
        super().__init__(message)
        self.message = message
        self.module = module
        self.severity = severity
        self.metadata = metadata or {}

class ValidationError(BaseError):
    """Raised when data validation fails."""
    def __init__(self, message: str, module: str, severity: str = "warn", metadata: dict = None):
        super().__init__(message, module, severity, metadata)

class ExecutionError(BaseError):
    """Raised when an execution task fails."""
    def __init__(self, message: str, module: str, severity: str = "critical", metadata: dict = None):
        super().__init__(message, module, severity, metadata)

class SystemError(BaseError):
    """Raised when a system-level failure occurs."""
    def __init__(self, message: str, module: str, severity: str = "critical", metadata: dict = None):
        super().__init__(message, module, severity, metadata)
