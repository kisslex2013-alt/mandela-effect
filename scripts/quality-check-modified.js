#!/usr/bin/env node

/**
 * Скрипт для проверки качества только измененных файлов
 * Используется в Git pre-commit hook
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

// Получаем список измененных файлов из Git
function getModifiedFiles() {
  try {
    const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
      stdio: 'pipe'
    }).trim().split('\n').filter(Boolean);

    const modifiedFiles = execSync('git diff --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
      stdio: 'pipe'
    }).trim().split('\n').filter(Boolean);

    // Объединяем staged и modified файлы
    const allFiles = [...new Set([...stagedFiles, ...modifiedFiles])];

    // Фильтруем только JS/TS файлы в src/
    return allFiles.filter(file => {
      const isSourceFile = /\.(js|jsx|ts|tsx)$/.test(file);
      const isInSrc = file.startsWith('src/');
      return isSourceFile && isInSrc;
    });
  } catch (error) {
    console.warn('⚠️  Не удалось получить список измененных файлов:', error.message);
    return [];
  }
}

// Проверяем наличие agent-enforcer
function checkAgentEnforcer() {
  try {
    execSync('node scripts/agent-enforcer.js --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// Основная функция
function main() {
  const files = getModifiedFiles();

  if (files.length === 0) {
    console.log('✅ Нет измененных JS/TS файлов для проверки');
    process.exit(0);
  }

  if (!checkAgentEnforcer()) {
    console.warn('⚠️  agent-enforcer не найден, пропускаем проверку');
    console.warn('   Убедитесь, что scripts/agent-enforcer.js существует');
    process.exit(0);
  }

  console.log(`🔍 Проверка ${files.length} измененных файлов...`);
  console.log(`   Файлы: ${files.slice(0, 3).join(', ')}${files.length > 3 ? '...' : ''}`);

  try {
    // Запускаем agent-enforcer для измененных файлов
    const filesArg = files.join(' ');
    execSync(`node scripts/agent-enforcer.js check ${filesArg}`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('✅ Проверка качества пройдена');
    process.exit(0);
  } catch (error) {
    console.error('❌ Проверка качества не прошла');
    console.error('   Исправьте ошибки перед коммитом');
    process.exit(1);
  }
}

main();

