@ECHO OFF
where gradle >NUL 2>&1
IF %ERRORLEVEL% EQU 0 ( gradle %* ) ELSE (
  ECHO Gradle not found. In IntelliJ: "Generate Gradle Wrapper" or install Gradle.
  EXIT /B 1
)
