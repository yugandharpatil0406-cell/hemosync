cmake_minimum_required(VERSION 3.10)
project(DSACompatibilityEngine CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(include)

add_executable(compatibility_engine
    src/main.cpp
    src/compatibility.cpp
    src/compatibility_server.cpp
)

if(WIN32)
    target_link_libraries(compatibility_engine ws2_32)
endif()
