<template>
  <div class="el-form-item" :class="[{
      'el-form-item--feedback': elForm && elForm.statusIcon,
      'is-error': validateState === 'error',
      'is-validating': validateState === 'validating',
      'is-success': validateState === 'success',
      'is-required': isRequired || required
    },
    sizeClass ? 'el-form-item--' + sizeClass : ''
  ]">
    <label :for="labelFor" class="el-form-item__label" :class="labelClass" v-bind:style="labelStyle" v-if="label || $slots.label">
      <slot name="label">{{label + form.labelSuffix}}</slot>
    </label>
    <div class="el-form-item__content" :class="contentClass" v-bind:style="contentStyle">
      <slot></slot>
      <transition name="el-zoom-in-top">
        <div
          v-if="validateState === 'error' && showMessage && form.showMessage"
          class="el-form-item__error"
          :class="{
            'el-form-item__error--inline': typeof inlineMessage === 'boolean'
              ? inlineMessage
              : (elForm && elForm.inlineMessage || false)
          }"
        >
          {{validateMessage}}
        </div>
      </transition>
    </div>
  </div>
</template>
<script>
  import AsyncValidator from 'async-validator';
  import emitter from 'element-ui/src/mixins/emitter';
  import { noop, getPropByPath } from 'element-ui/src/utils/util';

  export default {
    name: 'ElFormItem',

    componentName: 'ElFormItem',

    mixins: [emitter],

    provide() {
      return {
        elFormItem: this
      };
    },

    inject: ['elForm'],

    props: {
      label: String,
      labelWidth: String,
      labelClass: Array,
      contentClass: Array,
      prop: String,
      required: {
        type: Boolean,
        default: undefined
      },
      rules: [Object, Array],
      error: String,
      validateStatus: String,
      for: String,
      inlineMessage: {
        type: [String, Boolean],
        default: ''
      },
      showMessage: {
        type: Boolean,
        default: true
      },
      size: String
    },
    watch: {
      error(value) {
        this.validateMessage = value;
        this.validateState = value ? 'error' : '';
      },
      validateStatus(value) {
        this.validateState = value;
      }
    },
    computed: {
      propList() {
        var props = [];
        if (this.prop) {
          if (Array.isArray(this.prop)) {
            props = this.prop;
          } else if (this.prop.split) {
            props = this.prop.split('.');
          }
        }
        return props;
      },
      labelFor() {
        return this.for || this.prop;
      },
      labelStyle() {
        var ret = {};
        if (this.form.labelPosition === 'top') return ret;
        var labelWidth = this.labelWidth || this.form.labelWidth;
        if (labelWidth) {
          ret.width = labelWidth;
        }
        return ret;
      },
      contentStyle() {
        var ret = {};
        const label = this.label;
        if (this.form.labelPosition === 'top' || this.form.inline) return ret;
        if (!label && !this.labelWidth && this.isNested) return ret;
        var labelWidth = this.labelWidth || this.form.labelWidth;
        if (labelWidth) {
          ret.marginLeft = labelWidth;
        }
        return ret;
      },
      form() {
        let parent = this.$parent;
        let parentName = parent.$options.componentName;
        while (parentName !== 'ElForm') {
          if (parentName === 'ElFormItem') {
            this.isNested = true;
          }
          parent = parent.$parent;
          parentName = parent.$options.componentName;
        }
        return parent;
      },
      fieldValue: {
        cache: false,
        get() {
          var model = this.form.model;
          if (!model || !this.prop) { return; }

          var path = this.prop;
          if (path.indexOf(':') !== -1) {
            path = path.replace(/:/, '.');
          }

          return getPropByPath(model, path, true).v;
        }
      },
      isRequired() {
        let rules = this.getRulesList();
        let isRequired = false;

        if (rules && rules.length) {
          rules.every(rule => {
            if (rule.required) {
              isRequired = true;
              return false;
            }
            return true;
          });
        }
        return isRequired;
      },
      _formSize() {
        return this.elForm.size;
      },
      elFormItemSize() {
        return this.size || this._formSize;
      },
      sizeClass() {
        return (this.$ELEMENT || {}).size || this.elFormItemSize;
      }
    },
    data() {
      return {
        validateState: '',
        validateMessage: '',
        validateDisabled: false,
        validator: {},
        isNested: false
      };
    },
    methods: {
      validate(trigger, callback = noop) {
        this.validateDisabled = false;
        var rules = this.getFilteredRulesList(trigger);
        if ((!rules || rules.length === 0) && this.required === undefined) {
          this.clearValidate();
          callback();
          return true;
        }

        this.validateState = 'validating';

        var descriptor = {};
        descriptor[this.prop] = rules;

        var validator = new AsyncValidator(descriptor);
        var model = {};

        model[this.prop] = this.fieldValue;

        validator.validate(model, { firstFields: true }, (errors, fields) => {
          this.validateState = !errors ? 'success' : 'error';
          this.validateMessage = errors ? errors[0].message : '';
          callback(errors, fields);
        });
      },
      clearValidate() {
        this.validateState = '';
        this.validateMessage = '';
        this.validateDisabled = false;
      },
      resetField() {
        this.validateState = '';
        this.validateMessage = '';

        let model = this.form.model;
        let value = this.fieldValue;
        let path = this.prop;
        if (path.indexOf(':') !== -1) {
          path = path.replace(/:/, '.');
        }

        let prop = getPropByPath(model, path, true);

        if (Array.isArray(value)) {
          this.validateDisabled = true;
          prop.o[prop.k] = [].concat(this.initialValue);
        } else {
          this.validateDisabled = true;
          prop.o[prop.k] = this.initialValue;
        }
      },

      getRule() {
        var formRules = this.form.rules;
        var selfRules = this.rules;
        var requiredRule = this.required !== undefined ? { required: !!this.required } : [];

        // do not split this.prop if it is a keyword of form.rules
        if (formRules && formRules[this.prop]) {
          formRules = formRules ? formRules[this.prop] : [];
          return [].concat(selfRules || formRules || []).concat(requiredRule);
        } else if (this.propList.length >= 2) {
          const level1 = this.propList[0];
          const level2 = this.propList[1];
          var origin = formRules[level1];
          var fieldsRule = {};
          for (let key in origin) {
            fieldsRule[key] = origin[key];
          }
          fieldsRule.fields = {};
          fieldsRule.fields[level2] = [];
          if (origin && origin.hasOwnProperty('fields') && origin.fields[level2]) {
            fieldsRule.fields[level2] = [].concat(selfRules || origin.fields[level2] || []).concat(requiredRule);
          }
          return fieldsRule;
        } else if (selfRules) {
          return [].concat(selfRules || []).concat(requiredRule);
        } else {
          return null;
        }
      },
      getRulesList() {
        var rule = this.getRule();
        if (rule && rule.hasOwnProperty('fields')) {
          const level2 = this.propList[1];
          return rule.fields[level2];
        } else {
          return rule;
        }
      },

      getFilteredRulesList(trigger) {
        var rule = this.getRule();
        if (rule && rule.hasOwnProperty('fields')) {
          const level2 = this.propList[1];
          var result = {};
          for (let key in rule) {
            result[key] = rule[key];
          }
          result.fields[level2] = this.filterRuleByTrigger(trigger, result.fields[level2]);
          return result.fields[level2];
        } else {
          return this.filterRuleByTrigger(trigger, rule);
        }
      },

      getFilteredRule(trigger) {
        var rule = this.getRule();
        if (rule && rule.hasOwnProperty('fields')) {
          const level2 = this.propList[1];
          var result = {};
          for (let key in rule) {
            result[key] = rule[key];
          }
          result.fields[level2] = this.filterRuleByTrigger(trigger, result.fields[level2]);
          return result;
        } else {
          return this.filterRuleByTrigger(trigger, rule);
        }
      },
      filterRuleByTrigger(trigger, rules) {
        if (!trigger) {
          return rules;
        } else {
          return rules && Array.isArray(rules) ? rules.filter(rule => {
            return !rule.trigger || rule.trigger.indexOf(trigger) !== -1;
          }) : rules;
        }
      },

      onFieldBlur() {
        this.validate('blur');
      },
      onFieldChange() {
        if (this.validateDisabled) {
          this.validateDisabled = false;
          return;
        }

        this.validate('change');
      }
    },
    mounted() {
      if (this.prop) {
        this.dispatch('ElForm', 'el.form.addField', [this]);

        let initialValue = this.fieldValue;
        if (Array.isArray(initialValue)) {
          initialValue = [].concat(initialValue);
        }
        Object.defineProperty(this, 'initialValue', {
          value: initialValue
        });

        let rules = this.getRulesList();

        if ((rules && rules.length) || this.required !== undefined) {
          this.$on('el.form.blur', this.onFieldBlur);
          this.$on('el.form.change', this.onFieldChange);
        }
      }
    },
    beforeDestroy() {
      this.dispatch('ElForm', 'el.form.removeField', [this]);
    }
  };
</script>
