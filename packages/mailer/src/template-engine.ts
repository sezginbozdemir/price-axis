import Handlebars from "handlebars";
import { readFileSync } from "fs";
import { join } from "path";
import type { TemplateData } from "./types";

export class TemplateEngine {
  private templates = new Map<string, HandlebarsTemplateDelegate>();
  private templateDir: string;

  constructor(templateDir?: string) {
    this.templateDir = templateDir || join(process.cwd(), "templates");
    this.registerHelpers();
  }

  private registerHelpers() {
    // Register common Handlebars helpers
    Handlebars.registerHelper("eq", (a, b) => a === b);
    Handlebars.registerHelper("ne", (a, b) => a !== b);
    Handlebars.registerHelper("gt", (a, b) => a > b);
    Handlebars.registerHelper("lt", (a, b) => a < b);
    Handlebars.registerHelper("formatDate", (date) => {
      return new Date(date).toLocaleDateString();
    });
    Handlebars.registerHelper("capitalize", (str) => {
      return str.charAt(0).toUpperCase() + str.slice(1);
    });
  }

  loadTemplate(name: string, html?: string): void {
    if (html) {
      // Load template from string
      const template = Handlebars.compile(html);
      this.templates.set(name, template);
    } else {
      // Load template from file
      try {
        const templatePath = join(this.templateDir, `${name}.hbs`);
        const templateContent = readFileSync(templatePath, "utf-8");
        const template = Handlebars.compile(templateContent);
        this.templates.set(name, template);
      } catch (error) {
        throw new Error(`Failed to load template "${name}": ${error}`);
      }
    }
  }

  render(templateName: string, data: TemplateData = {}): string {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(
        `Template "${templateName}" not found. Make sure to load it first.`,
      );
    }

    return template(data);
  }

  hasTemplate(name: string): boolean {
    return this.templates.has(name);
  }

  removeTemplate(name: string): boolean {
    return this.templates.delete(name);
  }

  getLoadedTemplates(): string[] {
    return Array.from(this.templates.keys());
  }
}
