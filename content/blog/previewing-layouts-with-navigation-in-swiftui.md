---
title: 'Previewing layouts with navigation in SwiftUI'
description: "Look at this quick tip to preview NavigationStack in Xcode when develping your app in SwiftUI."
date: 2024-01-19
categories: ['SwiftUI']
sitemap:
  lastmod: 2024-01-19
---

I have just recently started my adventure on learning how to program with SwiftUI and one of the confusing topics for me was handling the preview of the navigation when building out my child views. Most of the time, I didn’t really care how the heading looked in comparison with the rest of the content – but there was a few times where I wish I knew! Then I figured out how to better use Preview mode to make this easier on me.

Let’s assume you are working with your child view here and your parent view has a NavigationStack wrapped the components already. If you add a NavigationStack to the child component, then you’ll have a double stack on the live version of your app. Obviously we do not want that.

The trick here is to modify your Preview code to render with the NavigationStack already in place. Here is an example code that I am using now:

```swift [ChildView.swift]
import SwiftUI

struct ChildView: View {
  var body: some View {
    Text("This is my child view")
      .navigationTitle("Child view")
  }
}

#Preview {
  return NavigationStack {
    ChildView()
  }
}
```

That’s it! You’ll now see the navigation title and any toolbars without needing to run the full app in the simulator.
