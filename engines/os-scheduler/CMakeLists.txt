cmake_minimum_required(VERSION 3.16)
project(os_scheduler_engine LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Include directories
include_directories(${CMAKE_SOURCE_DIR}/include)

# Source files
set(SOURCES
    src/main.cpp
    src/scheduler.cpp
    src/scheduler_server.cpp
)

# Executable
add_executable(os_scheduler ${SOURCES})

# Link winsock2 on Windows
if(WIN32)
    target_link_libraries(os_scheduler ws2_32)
endif()
