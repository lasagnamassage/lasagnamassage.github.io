# Monkey patch to fix liquid gem compatibility with Ruby 4.0
# Ruby 4.0 removed the untaint method, so we need to patch it out

if RUBY_VERSION >= "4.0"
  module Liquid
    module StandardFilters
      def escape(input)
        CGI.escapeHTML(input.to_s) unless input.nil?
      end
      alias_method :h, :escape
    end
  end
end
