<template>
  <span class="el-breadcrumb__item">
    <span class="el-breadcrumb__inner" ref="link" role="link">
      <slot></slot>
    </span>
    <i v-if="separatorClass" class="el-breadcrumb__separator" :class="separatorClass"></i>
    <span v-else class="el-breadcrumb__separator" role="presentation">{{separator}}</span>
  </span>
</template>
<script>
  import emitter from 'element-ui/src/mixins/emitter';
  export default {
    name: 'ElBreadcrumbItem',
    mixins: [emitter],
    props: {
      to: {},
      item: {
        type: Object,
        default: null
      },
      replace: Boolean
    },
    data() {
      return {
        separator: '',
        separatorClass: ''
      };
    },

    inject: ['elBreadcrumb'],

    mounted() {
      this.separator = this.elBreadcrumb.separator;
      this.separatorClass = this.elBreadcrumb.separatorClass;
      let self = this;
      let link = this.$refs.link;
      link.setAttribute('role', 'link');
      link.addEventListener('click', _ => {
        if (this.to) {
          self.replace ? self.$router.replace(this.to)
            : self.$router.push(this.to);
        }
        if (this.item) {
          this.dispatch('ElBreadcrumb', 'el.breadcrumb.item-click', this.item);
        }
      });
    }
  };
</script>
