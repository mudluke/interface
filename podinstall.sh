cd ios/ && pod install && sed -I '' 's/EXCLUDED_ARCHS\[sdk=iphonesimulator\*]" = ""/EXCLUDED_ARCHS\[sdk=iphonesimulator\*]" = "arm64 "/g' Uniswap.xcodeproj/project.pbxproj && cd ..
