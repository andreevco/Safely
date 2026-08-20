plugins {
    kotlin("jvm") version "2.1.0"
}

repositories {
    mavenCentral()
}

dependencies {
    testImplementation("junit:junit:4.13.2")
}

sourceSets {
    main {
        kotlin {
            setSrcDirs(listOf("../src/main/java"))
            include("**/MaskEngine.kt")
        }
    }
    test {
        kotlin {
            setSrcDirs(listOf("../src/test/java"))
            include("**/*Test.kt")
        }
    }
}

tasks.test {
    useJUnit()
    testLogging {
        events("passed", "failed", "skipped")
    }
}
