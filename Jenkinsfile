/*
 * Jenkinsfile — Multibranch Pipeline for learning-web
 *
 * PR / non-main branches:
 *   npm ci → build → start temp vite preview → QA → stop server
 *
 * main branch:
 *   npm ci → build → deploy persistent server (port 4173) → QA → keep running
 *   Lockable Resources prevents concurrent deployments
 */

def PREVIEW_PORT = "4175"
def PREVIEW_HOST = "127.0.0.1"
def PREVIEW_URL = "http://${PREVIEW_HOST}:${PREVIEW_PORT}"
def DEPLOY_PORT = "4173"
def DEPLOY_HOST = "127.0.0.1"
def DEPLOY_URL = "http://${DEPLOY_HOST}:${DEPLOY_PORT}"

pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: "10", artifactNumToKeepStr: "3"))
    }

    environment {
        PATH = "/opt/homebrew/bin:${env.PATH}"
    }

    stages {
        stage("Checkout") {
            steps {
                checkout scm
            }
        }

        stage("Install dependencies") {
            steps {
                sh "npm ci"
            }
        }

        stage("Build") {
            steps {
                sh "npm run build"
            }
        }

        stage("QA: Config Check") {
            steps {
                sh "npm run qa:config-check"
            }
        }

        // ────────────────────────────── PR flow ──────────────────────────────
        stage("Start preview (PR)") {
            when { not { branch "main" } }
            steps {
                sh """
                    echo "=== Starting vite preview on ${PREVIEW_URL} ==="
                    JENKINS_NODE_COOKIE=dontKillMe \
                    nohup npx vite preview \
                        --host ${PREVIEW_HOST} \
                        --port ${PREVIEW_PORT} \
                        > .jenkins/preview.log 2>&1 &
                    echo \$! > .jenkins/preview.pid
                    echo "Waiting for preview to be ready..."
                    for i in \$(seq 1 30); do
                        curl -s -o /dev/null ${PREVIEW_URL} && echo "Ready!" && break
                        sleep 1
                    done
                """
            }
        }

        stage("QA: Smoke (PR)") {
            when { not { branch "main" } }
            steps {
                sh """
                    QA_USE_LOCAL_SERVER=false \
                    QA_BASE_URL=${PREVIEW_URL} \
                    npm run qa:smoke
                """
            }
        }

        stage("Stop preview (PR)") {
            when { not { branch "main" } }
            steps {
                sh """
                    echo "=== Stopping preview server ==="
                    kill \$(cat .jenkins/preview.pid 2>/dev/null) 2>/dev/null || true
                    rm -f .jenkins/preview.pid .jenkins/preview.log
                """
            }
        }

        // ────────────────────────────── main flow ────────────────────────────
        stage("Deploy (main)") {
            when { branch "main" }
            steps {
                lock("learning-web-deploy") {
                    sh """
                        echo "=== Deploying learning-web to ${DEPLOY_URL} ==="
                        JENKINS_NODE_COOKIE=dontKillMe bash scripts/deploy-local.sh
                    """
                }
            }
        }

        stage("QA: Smoke (main)") {
            when { branch "main" }
            steps {
                sh """
                    QA_USE_LOCAL_SERVER=false \
                    QA_BASE_URL=${DEPLOY_URL} \
                    npm run qa:smoke
                """
            }
        }

        stage("QA: Data Sample (main)") {
            when { branch "main" }
            steps {
                sh """
                    QA_USE_LOCAL_SERVER=false \
                    QA_BASE_URL=${DEPLOY_URL} \
                    npm run qa:data-sample
                """
            }
        }
    }

    post {
        failure {
            echo "Pipeline failed. Check logs for details."
        }
        aborted {
            echo "Pipeline was aborted."
        }
    }
}
