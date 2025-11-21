#!/usr/bin/env node

/**
 * Agent Enforcer - инструмент для проверки качества кода
 * Проверяет файлы на соответствие правилам из .agent-enforcer.json
 */

import { readFileSync, existsSync, statSync, readdirSync } from 'fs';
import { join, dirname, relative, resolve, extname } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Читаем конфигурацию
function loadConfig() {
  const configPath = join(projectRoot, '.agent-enforcer.json');
  
  if (!existsSync(configPath)) {
    console.error('❌ .agent-enforcer.json не найден');
    process.exit(1);
  }

  try {
    return JSON.parse(readFileSync(configPath, 'utf-8'));
  } catch (error) {
    console.error('❌ Ошибка при чтении .agent-enforcer.json:', error.message);
    process.exit(1);
  }
}

// Проверяем, нужно ли игнорировать файл
function shouldIgnore(filePath, config) {
  const relativePath = relative(projectRoot, filePath);
  
  for (const pattern of config.ignore || []) {
    if (relativePath.includes(pattern)) {
      return true;
    }
    // Простая проверка по glob
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      if (regex.test(relativePath)) {
        return true;
      }
    }
  }
  
  return false;
}

// Получаем все файлы для проверки
async function getFilesToCheck(paths, config) {
  const files = new Set();
  
  for (const path of paths) {
    const fullPath = resolve(projectRoot, path);
    
    if (!existsSync(fullPath)) {
      // Путь не найден - это нормально, просто пропускаем
      continue;
    }
    
    const stat = statSync(fullPath);
    
    if (stat.isFile()) {
      if (!shouldIgnore(fullPath, config)) {
        files.add(fullPath);
      }
    } else if (stat.isDirectory()) {
      // Ищем все JS/TS файлы в директории
      const extensions = config.fileExtensions?.js_ts || ['.js', '.jsx', '.ts', '.tsx'];
      const patterns = extensions.map(ext => `${path}/**/*${ext}`);
      
      for (const pattern of patterns) {
        const found = await glob(pattern, {
          cwd: projectRoot,
          absolute: true,
          ignore: config.ignore || []
        });
        
        found.forEach(file => {
          if (!shouldIgnore(file, config)) {
            files.add(file);
          }
        });
      }
    }
  }
  
  return Array.from(files);
}

// Проверяем правило no-console
function checkNoConsole(content, filePath) {
  const issues = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Игнорируем комментарии и строки с console.error/warn (обычно это нормально)
    if (line.includes('console.log(') || line.includes('console.info(') || line.includes('console.debug(')) {
      // Проверяем, не в комментарии ли
      const trimmed = line.trim();
      if (!trimmed.startsWith('//') && !trimmed.startsWith('*') && !trimmed.startsWith('/*')) {
        issues.push({
          line: index + 1,
          column: line.indexOf('console'),
          rule: 'no-console',
          severity: 'warning',
          message: 'Использование console.log/info/debug'
        });
      }
    }
  });
  
  return issues;
}

// Проверяем правило no-debugger
function checkNoDebugger(content, filePath) {
  const issues = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    if (line.includes('debugger')) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('//') && !trimmed.startsWith('*')) {
        issues.push({
          line: index + 1,
          column: line.indexOf('debugger'),
          rule: 'no-debugger',
          severity: 'error',
          message: 'Использование debugger'
        });
      }
    }
  });
  
  return issues;
}

// Проверяем правило file-too-long
function checkFileTooLong(content, filePath, config) {
  const issues = [];
  const lines = content.split('\n');
  const maxLines = config.maxFileLength || 500;
  
  if (lines.length > maxLines) {
    issues.push({
      line: maxLines + 1,
      column: 1,
      rule: 'file-too-long',
      severity: 'warning',
      message: `Файл слишком длинный: ${lines.length} строк (максимум ${maxLines})`
    });
  }
  
  return issues;
}

// Проверяем файл
function checkFile(filePath, config, verbose = false) {
  const issues = [];
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    const rules = config.rules?.js_ts || {};
    const generalRules = config.rules?.general || {};
    
    // Проверяем правила для JS/TS
    if (rules['no-console'] !== 'off') {
      issues.push(...checkNoConsole(content, filePath));
    }
    
    if (rules['no-debugger'] !== 'off') {
      issues.push(...checkNoDebugger(content, filePath));
    }
    
    // Проверяем общие правила
    if (generalRules['file-too-long'] !== 'off') {
      issues.push(...checkFileTooLong(content, filePath, config));
    }
    
    // Фильтруем по severity из конфига
    return issues.filter(issue => {
      const ruleSeverity = rules[issue.rule] || generalRules[issue.rule];
      if (!ruleSeverity || ruleSeverity === 'off') {
        return false;
      }
      issue.severity = ruleSeverity;
      return true;
    });
    
  } catch (error) {
    if (verbose) {
      console.warn(`⚠️  Ошибка при проверке ${filePath}:`, error.message);
    }
    return [];
  }
}

// Выводим результаты
function printResults(results, verbose = false) {
  let hasErrors = false;
  let hasWarnings = false;
  let totalIssues = 0;
  
  for (const [filePath, issues] of Object.entries(results)) {
    if (issues.length === 0) {
      continue;
    }
    
    const relativePath = relative(projectRoot, filePath);
    console.log(`${relativePath}:`);
    
    for (const issue of issues) {
      if (issue.severity === 'error') {
        hasErrors = true;
      } else {
        hasWarnings = true;
      }
      totalIssues++;
      
      console.log(`  ${issue.line}:${issue.column} ${issue.severity} ${issue.rule}`);
      
      if (verbose && issue.message) {
        console.log(`    ${issue.message}`);
      }
    }
  }
  
  if (totalIssues === 0) {
    console.log('✅ Проверка качества пройдена, проблем не найдено');
    return 0;
  }
  
  console.log(`\n📊 Найдено проблем: ${totalIssues}`);
  if (hasErrors) {
    console.log(`   ❌ Ошибок: ${results[Object.keys(results).find(f => results[f].some(i => i.severity === 'error'))]?.filter(i => i.severity === 'error').length || 0}`);
  }
  if (hasWarnings) {
    console.log(`   ⚠️  Предупреждений: ${totalIssues - (results[Object.keys(results).find(f => results[f].some(i => i.severity === 'error'))]?.filter(i => i.severity === 'error').length || 0)}`);
  }
  
  return hasErrors ? 1 : 0;
}

// Основная функция
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] !== 'check') {
    console.log('Использование: agent-enforcer check <path> [--verbose]');
    console.log('Пример: agent-enforcer check src/');
    process.exit(1);
  }
  
  const verbose = args.includes('--verbose');
  const paths = args.filter(arg => arg !== 'check' && arg !== '--verbose');
  
  if (paths.length === 0) {
    console.error('❌ Укажите путь для проверки');
    process.exit(1);
  }
  
  const config = loadConfig();
  const files = await getFilesToCheck(paths, config);
  
  if (files.length === 0) {
    // Проверяем, существуют ли указанные пути
    const existingPaths = paths.filter(path => {
      const fullPath = resolve(projectRoot, path);
      return existsSync(fullPath);
    });
    
    if (existingPaths.length === 0) {
      // Ни один из путей не существует
      if (verbose) {
        console.log(`ℹ️  Указанные пути не найдены: ${paths.join(', ')}`);
      }
    }
    console.log('✅ Нет файлов для проверки');
    process.exit(0);
  }
  
  if (verbose) {
    console.log(`🔍 Проверка ${files.length} файлов...\n`);
  }
  
  const results = {};
  
  for (const file of files) {
    const issues = checkFile(file, config, verbose);
    if (issues.length > 0) {
      results[file] = issues;
    }
  }
  
  const exitCode = printResults(results, verbose);
  process.exit(exitCode);
}

// Обработка версии
if (process.argv.includes('--version') || process.argv.includes('-v')) {
  console.log('agent-enforcer v1.0.0');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});

